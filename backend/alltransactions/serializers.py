from rest_framework import serializers
from .models import Vendor, Purchase, PurchaseTransaction, Sales, SalesTransaction, VendorTransactions
from django.db import transaction
from allinventory.models import Product,Brand



class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'
    
class PurchaseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = Purchase
        fields = ['id', 'product', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']


class PurchaseTransactionSerializer(serializers.ModelSerializer):
    allpurchase = PurchaseSerializer(many=True)
    class Meta:
        model = PurchaseTransaction
        fields = '__all__'
    
    def create(self, validated_data):
        
        print(validated_data)
        purchases = validated_data.pop('allpurchase')
        purchase_transaction = PurchaseTransaction.objects.create(**validated_data)

        with transaction.atomic():
            for purchase in purchases:
                purchaseobj = Purchase.objects.create(purchase_transaction=purchase_transaction, **purchase)
                product = purchaseobj.product
                product.count = (product.count + purchaseobj.quantity) if product.count  is not None else purchaseobj.quantity
                product.stock = (product.stock + purchaseobj.quantity*product.unit_price) if product.stock is not None else purchaseobj.quantity*product.unit_price
                brand = product.brand
                brand.count = (brand.count + purchaseobj.quantity) if brand.count is not None else purchaseobj.quantity
                brand.stock = (brand.stock + purchaseobj.quantity*product.unit_price)if brand.stock is not None else purchaseobj.quantity*product.unit_price
                product.save()
                brand.save() 
    

            amount = purchase_transaction.calculate_total_amount()
            vendor = purchase_transaction.vendor
            brand = vendor.brand
            vendor.due = (vendor.due + amount) if vendor.due is not None else amount
            brand.stock = (brand.stock + amount) if brand.stock is not None else amount
            brand.save()
            vendor.save()

        return purchase_transaction
    
    def update(self, instance, validated_data):
        print(validated_data)
        print("HERERER")
        purchases_data = validated_data.pop('allpurchase', [])
        
        # Update transaction fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Begin an atomic transaction to ensure data integrity
        with transaction.atomic():
            # Keep track of existing purchases
            existing_purchases = {purchase.id: purchase for purchase in instance.allpurchase.all()}
            new_purchase_ids = []

            for purchase_data in purchases_data:
                print("HEREREREREAJKSDKS")
                print(purchase_data)
                purchase_id = purchase_data.get('id', None)
                print(purchase_id)
                if purchase_id and purchase_id in existing_purchases:
                    # Update existing purchase
                    purchase_instance = existing_purchases[purchase_id]
                    
                    # Store old values
                    old_product = purchase_instance.product
                    print(old_product)
                    old_quantity = purchase_instance.quantity

                    # Get new values
                    new_product = purchase_data.get('product', old_product)
                    print(new_product)
                    new_quantity = purchase_data.get('quantity', old_quantity)

                    # Adjust stock and count for old product and brand if product has changed
                    if old_product != new_product:
                        # Decrease stock and count from old product and brand
                        old_product.count -= old_quantity
                        old_product.stock -= old_quantity * old_product.unit_price
                        old_product.save()

                        old_brand = old_product.brand
                        old_brand.count -= old_quantity
                        old_brand.stock -= old_quantity * old_product.unit_price
                        old_brand.save()

                        # Increase stock and count in new product and brand
                        new_product_instance = Product.objects.get(id=new_product.id)
                        new_product_instance.count = (new_product_instance.count or 0) + new_quantity
                        new_product_instance.stock = (new_product_instance.stock + new_quantity * new_product_instance.unit_price) if new_product_instance.stock is not None else (new_quantity * new_product_instance.unit_price)  
                        new_product_instance.save()

                        new_brand = new_product_instance.brand
                        new_brand.count += new_quantity
                        new_brand.stock += new_quantity * new_product_instance.unit_price
                        new_brand.save()
                    else:
                        # Product hasn't changed, adjust stock and count based on quantity changes
                        quantity_diff = new_quantity - old_quantity
                        stock_diff = quantity_diff * old_product.unit_price

                        # Update product stock and count
                        old_product.count = (quantity_diff+ old_product.count) if old_product.count is not None else quantity_diff
                        print(old_product.count)
                        old_product.stock = (stock_diff + old_product.stock) if old_product.stock is not None else stock_diff
                        print(old_product.stock)
                        old_product.save()

                        # Update brand stock and count
                        old_brand = old_product.brand
                        old_brand.count += quantity_diff
                        old_brand.stock += stock_diff
                        old_brand.save()

                    # Update purchase instance
                    for attr, value in purchase_data.items():
                        setattr(purchase_instance, attr, value)
                    purchase_instance.save()
                    new_purchase_ids.append(purchase_instance.id)
                    del existing_purchases[purchase_id]
                else:
                    # Create new purchase
                    purchase_data['purchase_transaction'] = instance
                    new_purchase = Purchase.objects.create(**purchase_data)
                    new_product = new_purchase.product
                    new_product.count = (new_product.count or 0) + new_purchase.quantity
                    new_product.stock = (new_product.stock + new_purchase.quantity * new_product.unit_price) if new_product.stock is not None else new_purchase.quantity * new_product.unit_price
                    new_product.save()

                    new_brand = new_product.brand
                    new_brand.count += new_purchase.quantity
                    new_brand.stock += new_purchase.quantity * new_product.unit_price
                    new_brand.save()

                    new_purchase_ids.append(new_purchase.id)

            # Delete purchases that are not in the new data
            for purchase in existing_purchases.values():
                old_product = purchase.product
                old_quantity = purchase.quantity

                # Decrease stock and count from old product and brand
                old_product.count = (old_product.count - old_quantity) if old_product.count is not None else 0
                old_product.stock = (old_product.stock - old_quantity * old_product.unit_price) if old_product.stock is not None else 0
                old_product.save()

                old_brand = old_product.brand
                old_brand.count = (old_brand.count - old_quantity) if old_brand.count is not None else 0
                old_brand.stock = (old_brand.stock - old_quantity * old_product.unit_price) if old_brand.stock is not None else 0
                old_brand.save()

                # Delete the purchase
                purchase.delete()

            # Recalculate total amount
            instance.calculate_total_amount()
            
            # Update vendor due and brand stock
            vendor = instance.vendor
            brand = vendor.brand

            # Calculate total amount of purchases
            new_total_amount = sum(purchase.total_price for purchase in instance.allpurchase.all())
            old_total_amount = instance.total_price or 0  # Use the previous total price

            amount_diff = new_total_amount - old_total_amount

            vendor.due = (vendor.due or 0) + amount_diff
            vendor.save()
            
            # Since brand stock for purchases is already updated via product adjustments,
            # we may not need to adjust brand.stock here unless it represents something else

            # Update the transaction's total price
            instance.total_price = new_total_amount
            instance.save()

        return instance
    
class SalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sales
        fields = ['id', 'customer', 'phone', 'product', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']


class SalesTransactionSerializer(serializers.ModelSerializer):
    allsales = SalesSerializer(many=True)
    class Meta:
        model = SalesTransaction
        fields = '__all__'
    
    def create(self, validated_data):
        
        sales = validated_data.pop('allsales')
        transaction = SalesTransaction.objects.create(**validated_data)


        for sale in sales:
            saleobj = Sales.objects.create(sales_transaction=transaction, **sale)
            product = saleobj.product
            product.count = (product.count - saleobj.quantity) if product.stock is not None else saleobj.quantity
            product.stock = product.stock - saleobj.quantity*product.unit_price
            brand = product.brand
            brand.count = (brand.count - saleobj.quantity) if brand.stock is not None else saleobj.quantity
            brand.stock = brand.stock - saleobj.quantity*product.unit_price
            product.save()
            brand.save() 
    
        transaction.calculate_total_amount()


        return transaction
    
    def update(self, instance, validated_data):
        sales_data = validated_data.pop('allsales', [])
        
        # Update transaction fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Begin an atomic transaction
        with transaction.atomic():
            # Keep track of existing sales
            existing_sales = {sale.id: sale for sale in instance.allsales.all()}
            new_sales_ids = []

            for sale_data in sales_data:
                sale_id = sale_data.get('id', None)
                if sale_id and sale_id in existing_sales:
                    # Update existing sale
                    sale_instance = existing_sales[sale_id]
                    
                    # Store old values
                    old_product = sale_instance.product
                    old_quantity = sale_instance.quantity or 0

                    # Get new values
                    new_product = sale_data.get('product', old_product)
                    new_quantity = sale_data.get('quantity', old_quantity) or 0

                    # Adjust stock and count for old product and brand if product has changed
                    if old_product != new_product:
                        # Increase stock and count in old product and brand
                        old_product.count = (old_product.count or 0) + old_quantity
                        old_product.stock = (old_product.stock or 0) + old_quantity * (old_product.unit_price or 0)
                        old_product.save()

                        old_brand = old_product.brand
                        old_brand.count = (old_brand.count or 0) + old_quantity
                        old_brand.stock = (old_brand.stock or 0) + old_quantity * (old_product.unit_price or 0)
                        old_brand.save()

                        # Decrease stock and count from new product and brand
                        new_product_instance = Product.objects.get(id=new_product.id)
                        new_product_quantity = new_quantity or 0
                        new_product_instance.count = (new_product_instance.count or 0) - new_product_quantity
                        new_product_instance.stock = (new_product_instance.stock or 0) - new_product_quantity * (new_product_instance.unit_price or 0)
                        new_product_instance.save()

                        new_brand = new_product_instance.brand
                        new_brand.count = (new_brand.count or 0) - new_product_quantity
                        new_brand.stock = (new_brand.stock or 0) - new_product_quantity * (new_product_instance.unit_price or 0)
                        new_brand.save()
                    else:
                        # Product hasn't changed, adjust stock and count based on quantity changes
                        quantity_diff = (new_quantity or 0) - (old_quantity or 0)
                        stock_diff = quantity_diff * (old_product.unit_price or 0)

                        # Update product stock and count
                        old_product.count = (old_product.count or 0) - quantity_diff
                        old_product.stock = (old_product.stock or 0) - stock_diff
                        old_product.save()

                        # Update brand stock and count
                        old_brand = old_product.brand
                        old_brand.count = (old_brand.count or 0) - quantity_diff
                        old_brand.stock = (old_brand.stock or 0) - stock_diff
                        old_brand.save()

                    # Update sale instance
                    for attr, value in sale_data.items():
                        setattr(sale_instance, attr, value)
                    sale_instance.save()
                    new_sales_ids.append(sale_instance.id)
                    del existing_sales[sale_id]
                else:
                    # Create new sale
                    sale_data['sales_transaction'] = instance
                    new_sale = Sales.objects.create(**sale_data)
                    new_product = new_sale.product
                    new_quantity = new_sale.quantity or 0

                    new_product.count = (new_product.count or 0) - new_quantity
                    new_product.stock = (new_product.stock or 0) - new_quantity * (new_product.unit_price or 0)
                    new_product.save()

                    new_brand = new_product.brand
                    new_brand.count = (new_brand.count or 0) - new_quantity
                    new_brand.stock = (new_brand.stock or 0) - new_quantity * (new_product.unit_price or 0)
                    new_brand.save()

                    new_sales_ids.append(new_sale.id)

            # Delete sales that are not in the new data
            for sale in existing_sales.values():
                old_product = sale.product
                old_quantity = sale.quantity or 0

                # Increase stock and count in old product and brand
                old_product.count = (old_product.count or 0) + old_quantity
                old_product.stock = (old_product.stock or 0) + old_quantity * (old_product.unit_price or 0)
                old_product.save()

                old_brand = old_product.brand
                old_brand.count = (old_brand.count or 0) + old_quantity
                old_brand.stock = (old_brand.stock or 0) + old_quantity * (old_product.unit_price or 0)
                old_brand.save()

                # Delete the sale
                sale.delete()

            # Recalculate total amount
            instance.calculate_total_amount()

            # Update the transaction's total price
            instance.total_price = sum((sale.total_price or 0) for sale in instance.allsales.all())
            instance.save()

        return instance


class VendorTransactionSerialzier(serializers.ModelSerializer):

    class Meta:
        model = VendorTransactions
        fields = '__all__'
    
    def create(self, validated_data):

        transaction = VendorTransactions.objects.create(**validated_data)
        vendor = transaction.vendor
        vendor.due = (vendor.due - transaction.amount) if vendor.due is not None else -transaction.amount
        vendor.save()
        return transaction
    
    def update(self, instance, validated_data):

        old_vendor = instance.vendor
        old_amount = instance.amount
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.refresh_from_db()
        new_vendor = instance.vendor

        if old_vendor == new_vendor:
            new_vendor.due = new_vendor.due - instance.amount + old_amount
            new_vendor.save()

        else:
            old_vendor.due = old_vendor.due + old_amount
            new_vendor.due = new_vendor.due - instance.amount
            old_vendor.save()
            new_vendor.save()

        return instance