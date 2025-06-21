from rest_framework import serializers
from .models import Vendor, Purchase, PurchaseTransaction,PurchaseReturn, Sales, SalesTransaction, VendorTransactions, SalesReturn
from django.db import transaction
from allinventory.models import Product,Brand
from alltransactions.models import Staff,StaffTransactions



class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'
    
class PurchaseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    product_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Purchase
        fields = ['id','product_name', 'product', 'quantity', 'unit_price', 'total_price','returned']
        read_only_fields = ['total_price']

    def get_product_name(self, obj):
        return obj.product.name

class PurchaseTransactionSerializer(serializers.ModelSerializer):
    purchase = PurchaseSerializer(many=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateField()

    class Meta:
        model = PurchaseTransaction
        fields = '__all__'
    
    def create(self, validated_data):
        purchases = validated_data.pop('purchase')
        purchase_transaction = PurchaseTransaction.objects.create(**validated_data)

        with transaction.atomic():
            # Create each Purchase and update Product/Brand counts/stocks
            for purchase in purchases:
                if not purchase.get('total_price'):
                    purchase['total_price'] = purchase['quantity'] * purchase['unit_price']
                purchaseobj = Purchase.objects.create(purchase_transaction=purchase_transaction, **purchase)
                product = purchaseobj.product
                product.count = (product.count + purchaseobj.quantity) if product.count is not None else purchaseobj.quantity
                product.stock = (product.stock + purchaseobj.quantity * product.selling_price) if product.stock is not None else purchaseobj.quantity * product.selling_price
                brand = product.brand
                brand.count = (brand.count + purchaseobj.quantity) if brand.count is not None else purchaseobj.quantity
                brand.stock = (brand.stock + purchaseobj.quantity * product.selling_price) if brand.stock is not None else purchaseobj.quantity * product.selling_price
                product.save()
                brand.save() 
    
            # Calculate total amount and update vendor due
            amount = purchase_transaction.calculate_total_amount()
            vendor = purchase_transaction.vendor
            
            #first update the due for vendor then later make cash transaction or cheque transaction if needed
            # vendor.due = (vendor.due + amount) if vendor.due is not None else amount
            # vendor.save()

            VendorTransactionSerialzier().create({
                'vendor': vendor,
                'date': purchase_transaction.date,
                'amount': -amount,
                'desc': f'Purchase made for transaction {purchase_transaction.bill_no}',
                'method': purchase_transaction.method,
                'purchase_transaction': purchase_transaction,
                'enterprise': purchase_transaction.enterprise,
                'branch': purchase_transaction.branch,
                'type': 'base'
            })

            # Handle payment method -> create VendorTransactions if needed
            method = purchase_transaction.method
            if method == 'cash':
                print("HERERERE")
                vt = VendorTransactionSerialzier().create({
                    'vendor': vendor,
                    'branch': purchase_transaction.branch,
                    'date': purchase_transaction.date,
                    'amount': purchase_transaction.total_amount,
                    'desc': 'Paid for purchase',
                    'method': 'cash',
                    'purchase_transaction': purchase_transaction,
                    'enterprise': purchase_transaction.enterprise,
                    'type':'payment'

                })
                print(vt)
            elif method == 'cheque':
                VendorTransactionSerialzier().create({
                    'vendor': vendor,
                    'branch': purchase_transaction.branch,
                    'date': purchase_transaction.date,
                    'amount': purchase_transaction.total_amount,
                    'desc': 'Paid for purchase',
                    'method': 'cheque',
                    'cheque_number': purchase_transaction.cheque_number,
                    'cashout_date': purchase_transaction.cashout_date,
                    'purchase_transaction': purchase_transaction,
                    'enterprise': purchase_transaction.enterprise,
                    'type':'payment'
                })

        return purchase_transaction
    
    def update(self, instance, validated_data):
        
        # Store old values
        old_vendor = instance.vendor
        old_method = instance.method
        old_total = instance.total_amount or 0

        # Update transaction fields
        instance.vendor = validated_data.get('vendor', instance.vendor)
        instance.date = validated_data.get('date', instance.date)
        instance.method = validated_data.get('method', instance.method)
        instance.cheque_number = validated_data.get('cheque_number', instance.cheque_number)
        instance.cashout_date = validated_data.get('cashout_date', instance.cashout_date)
        instance.save()

        with transaction.atomic():
            purchases_data = validated_data.pop('purchase', [])
            
            # Keep track of existing purchases
            existing_purchases = {purchase.id: purchase for purchase in instance.purchase.all()} #1:<queryset 1>,...esari janxa
            print(existing_purchases)
            new_purchase_ids = []

            for purchase_data in purchases_data:
                purchase_id = purchase_data.get('id', None)
                if purchase_id and purchase_id in existing_purchases:
                    # Update existing purchase
                    purchase_instance = existing_purchases[purchase_id]
                    
                    # Store old values
                    old_product = purchase_instance.product
                    old_quantity = purchase_instance.quantity

                    # Get new values
                    new_product = purchase_data.get('product', old_product)
                    new_quantity = purchase_data.get('quantity', old_quantity)

                    # Adjust stock for old/new product if product changed
                    if old_product != new_product:
                        # Decrease from old product/brand
                        old_product.count -= old_quantity
                        old_product.stock -= old_quantity * old_product.selling_price
                        old_product.save()
                        old_brand = old_product.brand
                        old_brand.count -= old_quantity
                        old_brand.stock -= old_quantity * old_product.selling_price
                        old_brand.save()

                        # Increase in new product/brand
                        new_product.count = (new_product.count or 0) + new_quantity
                        new_product.stock = (new_product.stock or 0) + new_quantity * new_product.selling_price
                        new_product.save()
                        new_brand = new_product.brand
                        new_brand.count += new_quantity
                        new_brand.stock += new_quantity * new_product.selling_price
                        new_brand.save()
                    else:
                        # Same product -> adjust quantity
                        quantity_diff = new_quantity - old_quantity
                        stock_diff = quantity_diff * old_product.selling_price

                        old_product.count = (old_product.count or 0) + quantity_diff
                        old_product.stock = (old_product.stock or 0) + stock_diff
                        old_product.save()

                        old_brand = old_product.brand
                        old_brand.count += quantity_diff
                        old_brand.stock += stock_diff
                        old_brand.save()

                    for attr, value in purchase_data.items():
                        setattr(purchase_instance, attr, value)

                    if not purchase_data.get('total_price'):
                        purchase_instance.total_price = purchase_instance.quantity * purchase_instance.unit_price
                    purchase_instance.save()
                    new_purchase_ids.append(purchase_instance.id)
                    del existing_purchases[purchase_id]
                else:
                    # Create new purchase
                    purchase_data['purchase_transaction'] = instance
                    if not purchase_data.get('total_price'):
                        purchase_data['total_price'] = purchase_data['quantity'] * purchase_data['unit_price']
                    new_purchase = Purchase.objects.create(**purchase_data)
                    new_product = new_purchase.product
                    new_product.count = (new_product.count or 0) + new_purchase.quantity
                    new_product.stock = (new_product.stock or 0) + new_purchase.quantity * new_product.selling_price
                    new_product.save()

                    new_brand = new_product.brand
                    new_brand.count += new_purchase.quantity
                    new_brand.stock += new_purchase.quantity * new_product.selling_price
                    new_brand.save()

                    new_purchase_ids.append(new_purchase.id)

            # Delete purchases not in new data
            for purchase in existing_purchases.values():
                old_product = purchase.product
                old_quantity = purchase.quantity
                old_product.count = (old_product.count or 0) - old_quantity
                old_product.stock = (old_product.stock or 0) - old_quantity * old_product.selling_price
                old_product.save()

                old_brand = old_product.brand
                old_brand.count = (old_brand.count or 0) - old_quantity
                old_brand.stock = (old_brand.stock or 0) - old_quantity * old_product.selling_price
                old_brand.save()

                purchase.delete()

            # Recalculate total amount ###############
            instance.calculate_total_amount()
            instance.refresh_from_db()
            new_total_amount = instance.total_amount
            instance.save()

            # Update vendor due
            new_vendor = instance.vendor
            amount_diff = new_total_amount - old_total

            # If vendor changed
            
            if old_vendor != new_vendor:
                #update method on vendortransactionserializers
                vt= VendorTransactions.objects.filter(purchase_transaction=instance,type='base').first()
                                
                if vt:
                    vts = VendorTransactionSerialzier(vt, data={'vendor': new_vendor.id}, partial=True) #partial=True, allowing to update only vendor field.
                    if vts.is_valid():
                        vts.save()
                    else:
                        print(vts.errors) #print errors, for debugging purpose.
                else:
                    print("No matching VendorTransactions found.")

                # if old_vendor.due is None:
                #     old_vendor.due = 0
                # old_vendor.due -= old_total
                # old_vendor.save()

                # if new_vendor.due is None:
                #     new_vendor.due = 0
                # new_vendor.due += new_total_amount
                # new_vendor.save()
            else:
                # Same vendor; just adjust by the difference
                #only do ut for credit else tala milako xa:::::delete garera feri transaction post garya xa
                vt= VendorTransactions.objects.filter(purchase_transaction=instance,type='base').first()
                print("SAME PO RE TA")

                vts = VendorTransactionSerialzier(vt, data={'amount':-new_total_amount}, partial=True) #partial=True, allowing to update only vendor field.
                if vts.is_valid():
                    vts.save()
                    print(vts.data)
                else:
                    print(vts.errors)
                new_vendor.refresh_from_db()
                print('------------------------------------------------------------------------------------',new_vendor.due)

            # Handle VendorTransactions for payment method changes or total changes
            new_method = instance.method

            returned_amount = 0
            for purchase in instance.purchase.all():
                if purchase.returned:
                    returned_amount += purchase.total_price
            # Remove old vendor transaction if method changed or vendor changed
            if old_method != new_method or old_vendor != new_vendor:
                old_vt = VendorTransactions.objects.filter(purchase_transaction=instance,type='payment').first()
                print("HERE")
                # return instance
                if old_vt:
                    # print("before due",old_vendor.due)
                    print("NOT HERE")
                    old_vt.delete()
                    old_vendor.refresh_from_db()
                    new_vendor.refresh_from_db()
                # Create new vendor transaction if new_method is cash or cheque
                if new_method == 'cash':
                    new_vendor.refresh_from_db()

                    VendorTransactionSerialzier().create({
                        'vendor': new_vendor,
                        'date': instance.date,
                        'amount': instance.total_amount-returned_amount,
                        'desc': 'Paid for purchase',
                        'method': 'cash',
                        'purchase_transaction': instance,
                        'enterprise': instance.enterprise,
                        'branch': instance.branch,
                        'type':'payment'

                    })
                    new_vendor.refresh_from_db()
                    return instance
                    # print("New method is cash")
                    # print("after_due is ",new_vendor.due)
                elif new_method == 'cheque':
                    VendorTransactionSerialzier().create({
                        'vendor': new_vendor,
                        'date': instance.date,
                        'amount': instance.total_amount-returned_amount,
                        'desc': 'Paid for purchase',
                        'method': 'cheque',
                        'cheque_number': instance.cheque_number,
                        'cashout_date': instance.cashout_date,
                        'purchase_transaction': instance,
                        'enterprise': instance.enterprise,
                        'branch': instance.branch,
                        'type':'payment'
                    })
            else:
                # Same method, same vendor => update existing vendor transaction amount if total changed
                if amount_diff != 0 and new_method != 'credit':
                    vt = VendorTransactions.objects.filter(purchase_transaction=instance,type='payment').first()
                    if vt:
                        vts = VendorTransactionSerialzier(vt, data={'amount':instance.total_amount,'desc':"touch chai vayo"}, partial=True) #partial=True, allowing to update only vendor field.
                        if vts.is_valid():
                            vts.save()
                            print(vts.data)
                        else:
                            print(vts.errors)

        return instance
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Format the date in 'YYYY-MM-DD' format for the response
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation
    
    def get_vendor_name(self, obj):
        return obj.vendor.name
  
class SalesSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    product_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Sales
        fields = ['id', 'product', 'quantity', 'unit_price', 'total_price','product_name','returned']
        read_only_fields = ['total_price']

    def get_product_name(self, obj):
        return obj.product.name

class SalesTransactionSerializer(serializers.ModelSerializer):  
    sales = SalesSerializer(many=True)
    date = serializers.DateField()

    class Meta:
        model = SalesTransaction
        fields = '__all__'
    @transaction.atomic
    def create(self, validated_data):
        
        sales = validated_data.pop('sales')
        # print(sales)
        transaction = SalesTransaction.objects.create(**validated_data)


        for sale in sales:
            saleobj = Sales.objects.create(sales_transaction=transaction, **sale)
            product = saleobj.product
            product.count = (product.count - saleobj.quantity) if product.stock is not None else saleobj.quantity
            product.stock = (product.stock - saleobj.quantity*product.selling_price) if product.stock is not None else saleobj.quantity*product.selling_price
            brand = product.brand
            brand.count = (brand.count - saleobj.quantity) if brand.stock is not None else saleobj.quantity
            brand.stock = (brand.stock - saleobj.quantity*product.selling_price) if brand.stock is not None else saleobj.quantity*product.selling_price
            product.save()
            brand.save() 
    
        transaction.calculate_total_amount()


        return transaction
    
    def update(self, instance, validated_data):
        sales_data = validated_data.pop('sales', [])
        
        # Update transaction fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Begin an atomic transaction
        with transaction.atomic():
            # Keep track of existing sales
            existing_sales = {sale.id: sale for sale in instance.sales.all()}
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
                        old_product.stock = (old_product.stock or 0) + old_quantity * (old_product.selling_price or 0)
                        old_product.save()

                        old_brand = old_product.brand
                        old_brand.count = (old_brand.count or 0) + old_quantity
                        old_brand.stock = (old_brand.stock or 0) + old_quantity * (old_product.selling_price or 0)
                        old_brand.save()

                        # Decrease stock and count from new product and brand
                        new_product_instance = Product.objects.get(id=new_product.id)
                        new_product_quantity = new_quantity or 0
                        new_product_instance.count = (new_product_instance.count or 0) - new_product_quantity
                        new_product_instance.stock = (new_product_instance.stock or 0) - new_product_quantity * (new_product_instance.selling_price or 0)
                        new_product_instance.save()

                        new_brand = new_product_instance.brand
                        new_brand.count = (new_brand.count or 0) - new_product_quantity
                        new_brand.stock = (new_brand.stock or 0) - new_product_quantity * (new_product_instance.selling_price or 0)
                        new_brand.save()
                    else:
                        # Product hasn't changed, adjust stock and count based on quantity changes
                        quantity_diff = (new_quantity or 0) - (old_quantity or 0)
                        stock_diff = quantity_diff * (old_product.selling_price or 0)

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
                    new_product.stock = (new_product.stock or 0) - new_quantity * (new_product.selling_price or 0)
                    new_product.save()

                    new_brand = new_product.brand
                    new_brand.count = (new_brand.count or 0) - new_quantity
                    new_brand.stock = (new_brand.stock or 0) - new_quantity * (new_product.selling_price or 0)
                    new_brand.save()

                    new_sales_ids.append(new_sale.id)

            # Delete sales that are not in the new data
            for sale in existing_sales.values():
                old_product = sale.product
                old_quantity = sale.quantity or 0

                # Increase stock and count in old product and brand
                old_product.count = (old_product.count or 0) + old_quantity
                old_product.stock = (old_product.stock or 0) + old_quantity * (old_product.selling_price or 0)
                old_product.save()

                old_brand = old_product.brand
                old_brand.count = (old_brand.count or 0) + old_quantity
                old_brand.stock = (old_brand.stock or 0) + old_quantity * (old_product.selling_price or 0)
                old_brand.save()

                # Delete the sale
                sale.delete()

            # Recalculate total amount
            

            # Update the transaction's total price
            instance.save()
            instance.refresh_from_db()
            instance.calculate_total_amount()

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Format the date in 'YYYY-MM-DD' format for the response
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation

class VendorTransactionSerialzier(serializers.ModelSerializer):
    date = serializers.DateField()
    vendor_name = serializers.SerializerMethodField()
    class Meta:
        model = VendorTransactions
        fields = '__all__'

    def get_vendor_name(self,obj):
        return obj.vendor.name
    
    @transaction.atomic
    def create(self, validated_data):
        transaction = VendorTransactions.objects.create(**validated_data)
        vendor = transaction.vendor
        vendor.due = (vendor.due - transaction.amount) if vendor.due is not None else -transaction.amount
        vendor.save()
        return transaction
    
    @transaction.atomic
    def update(self, instance, validated_data):

        old_vendor = instance.vendor
        old_amount = instance.amount
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.refresh_from_db()
        new_vendor = instance.vendor

        if old_vendor == new_vendor:
            new_vendor.due = (new_vendor.due - instance.amount + old_amount) if new_vendor.due is not None else -instance.amount + old_amount
            new_vendor.save()

        else:
            old_vendor.due = old_vendor.due + old_amount
            new_vendor.due = (new_vendor.due - instance.amount) if new_vendor.due is not None else -instance.amount
            old_vendor.save()
            new_vendor.save()

        return instance
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Format the date in 'YYYY-MM-DD' format for the response
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation

class VendorBrandSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField(read_only = True)

    class Meta:
        model = Brand
        fields = '__all__'
    
    def get_count(self,obj):
        vendors = Vendor.objects.filter(enterprise = obj.enterprise, brand = obj).count()
        return vendors
    
class PurchaseReturnSerializer(serializers.ModelSerializer):
   
    purchase_transaction = PurchaseTransactionSerializer(read_only=True)
    purchases = PurchaseSerializer(many=True,read_only=True) ##related name

    # Write-only fields for accepting the IDs in the request
    purchase_transaction_id = serializers.PrimaryKeyRelatedField(
        queryset=PurchaseTransaction.objects.all(),
        write_only=True,
        source='purchase_transaction'
    )
    purchase_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Purchase.objects.all(),
        write_only=True
    )


    class Meta:
        model = PurchaseReturn
        # fields = '__all__'
        fields = [
            'id',
            'date',
            'branch',
            'enterprise',
            'purchase_transaction',
            'purchase_transaction_id',  # for write
            'purchases',       # for read
            'purchase_ids' ,    # for write
        ]

    @transaction.atomic
    def create(self, validated_data):

        
        purchase_ids = validated_data.pop('purchase_ids', [])

        # Create the PurchaseReturn instance
        purchase_return = PurchaseReturn.objects.create(**validated_data)


        # Retrieve the vendor from the linked transaction
        vendor = purchase_return.purchase_transaction.vendor

        # We'll subtract the total of all returned purchases
        total_unit_price = 0
        # print(purchase_ids)

        # Attach each purchase to this return
        for purchase in purchase_ids:

            purchase.purchase_return = purchase_return
            purchase.returned = True
            purchase.save()
            total_unit_price += purchase.unit_price * purchase.quantity
            product = purchase.product
            product.count = (product.count - purchase.quantity) if product.count is not None else - purchase.quantity
            product.stock = (product.stock - purchase.quantity * product.selling_price) if product.stock is not None else - purchase.quantity * product.selling_price
            brand = product.brand
            brand.count = (brand.count - purchase.quantity) if brand.count is not None else - purchase.quantity
            brand.stock = (brand.stock - purchase.quantity * product.selling_price) if brand.stock is not None else - purchase.quantity * product.selling_price
            brand.save()
            product.save()

        # Update vendor dues if needed
        if vendor.due is None:
            vendor.due = 0

        ####use vendor transactions to update the dues
        print(vendor.due)
        VendorTransactionSerialzier().create({
            'vendor': vendor,
            'date': purchase_return.date,
            'amount': total_unit_price,
            'desc': f'Purchase return for transaction {purchase_return.purchase_transaction.bill_no}',
            'method': purchase_return.purchase_transaction.method,
            'purchase_transaction': purchase_return.purchase_transaction,
            'enterprise': purchase_return.enterprise,
            'branch': purchase_return.branch,
            'type':'return'
        })
        vendor.refresh_from_db()
        print(vendor.due)

        return purchase_return

    @transaction.atomic
    def delete(self, instance):
        purchase_ids = instance.purchases.all()
        vendor = instance.purchase_transaction.vendor
        total_unit_price = 0
        for purchase in purchase_ids:
            purchase.returned = False
            purchase.save()
            total_unit_price += purchase.unit_price * purchase.quantity
            purchase.product.count = (purchase.product.count + purchase.quantity) if purchase.product.count is not None else purchase.quantity
            purchase.product.stock = (purchase.product.stock + purchase.quantity * purchase.product.selling_price) if purchase.product.stock is not None else purchase.quantity * purchase.product.selling_price
            purchase.product.brand.count = (purchase.product.brand.count + purchase.quantity) if purchase.product.brand.count is not None else purchase.quantity
            purchase.product.brand.stock = (purchase.product.brand.stock + purchase.quantity * purchase.product.selling_price) if purchase.product.brand.stock is not None else purchase.quantity * purchase.product.selling_price
            purchase.product.brand.save()
            purchase.product.save()
            
        vt = VendorTransactions.objects.filter(purchase_transaction=instance.purchase_transaction,type="return").first()
        print(vt)   
        vt.delete()
        instance.delete()
        return instance

class SalesReturnSerializer(serializers.ModelSerializer):
   
    sales_transaction = SalesTransactionSerializer(read_only=True)
    sales = SalesSerializer(many=True,read_only=True) ##related name

    # Write-only fields for accepting the IDs in the request
    sales_transaction_id = serializers.PrimaryKeyRelatedField(
        queryset=SalesTransaction.objects.all(),
        write_only=True,
        source='sales_transaction'
    )
    sales_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Sales.objects.all(),
        write_only=True
    )


    class Meta:
        model = PurchaseReturn
        # fields = '__all__'
        fields = [
            'id',
            'date',
            'branch',
            'enterprise',
            'sales_transaction',
            'sales_transaction_id',  # for write
            'sales',       # for read
            'sales_ids' ,    # for write
        ]

    @transaction.atomic
    def create(self, validated_data):

        
        sales_ids = validated_data.pop('sales_ids', [])

        # Create the PurchaseReturn instance
        sales_return = SalesReturn.objects.create(**validated_data)


        # Retrieve the vendor from the linked transaction
        # vendor = sales_return.sales_transaction.vendor

        # We'll subtract the total of all returned purchases
        # total_unit_price = 0
        # print(purchase_ids)

        # Attach each purchase to this return
        for sale in sales_ids:

            sale.sales_return = sales_return
            sale.returned = True
            sale.save()
            product = sale.product
            product.count = (product.count + sale.quantity) if product.count is not None else sale.quantity
            product.stock = (product.stock + sale.quantity * product.selling_price) if product.stock is not None else sale.quantity * product.selling_price
            brand = product.brand
            brand.count = (brand.count + sale.quantity) if brand.count is not None else sale.quantity
            brand.stock = (brand.stock + sale.quantity * product.selling_price) if brand.stock is not None else sale.quantity * product.selling_price
            brand.save()
            product.save()

        # Update vendor dues if needed
        # if vendor.due is None:
        #     vendor.due = 0
        # vendor.due -= total_unit_price
        # vendor.save()

        return sales_return


    def delete(self, instance):
        sales_ids = instance.sales.all()
        # vendor = instance.purchase_transaction.vendor
        # total_unit_price = 0
        for sale in sales_ids:
            sale.returned = False
            sale.save()
            # total_unit_price += sale.unit_price * sale.quantity
            sale.product.count = (sale.product.count - sale.quantity) if sale.product.count is not None else -(sale.quantity)
            sale.product.stock = (sale.product.stock - sale.quantity * sale.product.selling_price) if sale.product.stock is not None else -(sale.quantity * sale.product.selling_price)
            sale.product.brand.count = (sale.product.brand.count - sale.quantity) if sale.product.brand.count is not None else - (sale.quantity)
            sale.product.brand.stock = (sale.product.brand.stock - sale.quantity * sale.product.selling_price) if sale.product.brand.stock is not None else -(sale.quantity * sale.product.selling_price)
            sale.product.brand.save()
            sale.product.save()
            
        # vendor.due += total_unit_price
        # vendor.save()
        instance.delete()
        return instance

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class StaffTransactionSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = StaffTransactions
        fields = '__all__'

    def create(self, validated_data):

        transaction = StaffTransactions.objects.create(**validated_data)
        staff = transaction.staff
        staff.due = (staff.due - transaction.amount) if staff.due is not None else -transaction.amount
        staff.save()
        return transaction
    
    def update(self, instance, validated_data):
        print("HERE")
        old_staff = instance.staff
        old_amount = instance.amount
        print(old_amount)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.refresh_from_db()
        new_staff = instance.staff

        if old_staff == new_staff:
            new_staff.due = new_staff.due - instance.amount + old_amount
            print(new_staff.due)
            new_staff.save()
            print(new_staff.due)
            staff = Staff.objects.get(id = new_staff.id)
            print(staff.due)

        else:
            old_staff.due = old_staff.due + old_amount
            new_staff.due = new_staff.due - instance.amount
            old_staff.save()
            new_staff.save()

        return instance
    
    def get_staff_name(self,obj):
        return obj.staff.name
