from rest_framework import serializers
from django.db import transaction
from allinventory.models import Product, Brand
from enterprise.models import Enterprise, Branch
from alltransactions.models import Staff, StaffTransactions
from .models import (
    Vendor, Purchase, PurchaseTransaction, PurchaseReturn,
    Sales, SalesTransaction, VendorTransactions
)

class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'


class PurchaseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    product_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Purchase
        fields = ['id', 'product_name', 'product', 'quantity', 'unit_price', 'total_price', 'returned']
        read_only_fields = ['total_price']

    def get_product_name(self, obj):
        return obj.product.name


class PurchaseTransactionSerializer(serializers.ModelSerializer):
    purchase = PurchaseSerializer(many=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateField()
    # Note: branch, bill_no, enterprise, etc. are included via __all__

    class Meta:
        model = PurchaseTransaction
        fields = '__all__'

    def create(self, validated_data):
        purchases = validated_data.pop('purchase')
        purchase_transaction = PurchaseTransaction.objects.create(**validated_data)

        with transaction.atomic():
            for purchase in purchases:
                if not purchase.get('total_price'):
                    purchase['total_price'] = purchase['quantity'] * purchase['unit_price']
                purchase_obj = Purchase.objects.create(purchase_transaction=purchase_transaction, **purchase)
                # Update product and brand counts and stocks
                product = purchase_obj.product
                product.count = (product.count + purchase_obj.quantity) if product.count is not None else purchase_obj.quantity
                product.stock = (product.stock + purchase_obj.quantity * product.selling_price) if product.stock is not None else purchase_obj.quantity * product.selling_price
                product.save()

                brand = product.brand
                brand.count = (brand.count + purchase_obj.quantity) if brand.count is not None else purchase_obj.quantity
                brand.stock = (brand.stock + purchase_obj.quantity * product.selling_price) if brand.stock is not None else purchase_obj.quantity * product.selling_price
                brand.save()

            # Recalculate total amount and update vendor due
            amount = purchase_transaction.calculate_total_amount()
            vendor = purchase_transaction.vendor
            vendor.due = (vendor.due + amount) if vendor.due is not None else amount
            vendor.save()

            # Create VendorTransaction if payment method requires it
            method = purchase_transaction.method
            if method == 'cash':
                VendorTransactionSerialzier().create({
                    'vendor': vendor,
                    'date': purchase_transaction.date,
                    'amount': purchase_transaction.total_amount,
                    'desc': 'Paid for purchase',
                    'method': 'cash',
                    'purchase_transaction': purchase_transaction,
                    'enterprise': purchase_transaction.enterprise
                })
            elif method == 'cheque':
                VendorTransactionSerialzier().create({
                    'vendor': vendor,
                    'date': purchase_transaction.date,
                    'amount': purchase_transaction.total_amount,
                    'desc': 'Paid for purchase',
                    'method': 'cheque',
                    'cheque_number': purchase_transaction.cheque_number,
                    'cashout_date': purchase_transaction.cashout_date,
                    'purchase_transaction': purchase_transaction,
                    'enterprise': purchase_transaction.enterprise
                })
        return purchase_transaction

    def update(self, instance, validated_data):
        old_vendor = instance.vendor
        old_method = instance.method
        old_total = instance.total_amount or 0

        # Update core transaction fields including the new branch and bill number
        instance.vendor = validated_data.get('vendor', instance.vendor)
        instance.branch = validated_data.get('branch', instance.branch)
        instance.bill_no = validated_data.get('bill_no', instance.bill_no)
        instance.date = validated_data.get('date', instance.date)
        instance.method = validated_data.get('method', instance.method)
        instance.cheque_number = validated_data.get('cheque_number', instance.cheque_number)
        instance.cashout_date = validated_data.get('cashout_date', instance.cashout_date)
        instance.enterprise = validated_data.get('enterprise', instance.enterprise)
        instance.save()

        with transaction.atomic():
            purchases_data = validated_data.pop('purchase', [])
            existing_purchases = {p.id: p for p in instance.purchase.all()}
            new_purchase_ids = []

            for purchase_data in purchases_data:
                purchase_id = purchase_data.get('id', None)
                if purchase_id and purchase_id in existing_purchases:
                    purchase_instance = existing_purchases[purchase_id]
                    old_product = purchase_instance.product
                    old_quantity = purchase_instance.quantity
                    new_product = purchase_data.get('product', old_product)
                    new_quantity = purchase_data.get('quantity', old_quantity)

                    if old_product != new_product:
                        # Adjust old product/brand
                        old_product.count = old_product.count - old_quantity
                        old_product.stock = old_product.stock - old_quantity * old_product.selling_price
                        old_product.save()
                        old_brand = old_product.brand
                        old_brand.count = old_brand.count - old_quantity
                        old_brand.stock = old_brand.stock - old_quantity * old_product.selling_price
                        old_brand.save()
                        # Increase new product/brand
                        new_product.count = (new_product.count or 0) + new_quantity
                        new_product.stock = (new_product.stock or 0) + new_quantity * new_product.selling_price
                        new_product.save()
                        new_brand = new_product.brand
                        new_brand.count = (new_brand.count or 0) + new_quantity
                        new_brand.stock = (new_brand.stock or 0) + new_quantity * new_product.selling_price
                        new_brand.save()
                    else:
                        quantity_diff = new_quantity - old_quantity
                        stock_diff = quantity_diff * old_product.selling_price
                        old_product.count = (old_product.count or 0) + quantity_diff
                        old_product.stock = (old_product.stock or 0) + stock_diff
                        old_product.save()
                        old_brand = old_product.brand
                        old_brand.count = (old_brand.count or 0) + quantity_diff
                        old_brand.stock = (old_brand.stock or 0) + stock_diff
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
                    new_brand.count = (new_brand.count or 0) + new_purchase.quantity
                    new_brand.stock = (new_brand.stock or 0) + new_purchase.quantity * new_product.selling_price
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

            instance.calculate_total_amount()
            new_total_amount = sum(p.total_price for p in instance.purchase.all())
            instance.total_amount = new_total_amount
            instance.save()

            new_vendor = instance.vendor
            amount_diff = new_total_amount - old_total

            if old_vendor != new_vendor:
                old_vendor.due = (old_vendor.due or 0) - old_total
                old_vendor.save()
                new_vendor.due = (new_vendor.due or 0) + new_total_amount
                new_vendor.save()
            else:
                if instance.method != 'cash':
                    new_vendor.due = (new_vendor.due or 0) + amount_diff
                    new_vendor.save()

            new_method = instance.method
            if old_method != new_method or old_vendor != new_vendor:
                old_vt = VendorTransactions.objects.filter(purchase_transaction=instance).first()
                if old_vt:
                    old_vt.delete()
                    old_vendor.refresh_from_db()
                    new_vendor.refresh_from_db()
                if new_method == 'cash':
                    VendorTransactionSerialzier().create({
                        'vendor': new_vendor,
                        'date': instance.date,
                        'amount': instance.total_amount,
                        'desc': 'Paid for purchase',
                        'method': 'cash',
                        'purchase_transaction': instance,
                        'enterprise': instance.enterprise
                    })
                elif new_method == 'cheque':
                    VendorTransactionSerialzier().create({
                        'vendor': new_vendor,
                        'date': instance.date,
                        'amount': instance.total_amount,
                        'desc': 'Paid for purchase',
                        'method': 'cheque',
                        'cheque_number': instance.cheque_number,
                        'cashout_date': instance.cashout_date,
                        'purchase_transaction': instance,
                        'enterprise': instance.enterprise
                    })
            else:
                if amount_diff != 0 and new_method != 'credit':
                    vt = VendorTransactions.objects.filter(purchase_transaction=instance).first()
                    if vt:
                        vt.amount = instance.total_amount
                        vt.save()
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation

    def get_vendor_name(self, obj):
        return obj.vendor.name


class SalesSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    product_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Sales
        fields = ['id', 'product', 'quantity', 'unit_price', 'total_price', 'product_name']
        read_only_fields = ['total_price']

    def get_product_name(self, obj):
        return obj.product.name


class SalesTransactionSerializer(serializers.ModelSerializer):
    sales = SalesSerializer(many=True)
    date = serializers.DateField()

    class Meta:
        model = SalesTransaction
        fields = '__all__'

    def create(self, validated_data):
        sales = validated_data.pop('sales')
        transaction = SalesTransaction.objects.create(**validated_data)
        for sale in sales:
            sale_obj = Sales.objects.create(sales_transaction=transaction, **sale)
            product = sale_obj.product
            product.count = (product.count - sale_obj.quantity) if product.count is not None else sale_obj.quantity
            product.stock = (product.stock - sale_obj.quantity * product.unit_price) if product.stock is not None else sale_obj.quantity * product.unit_price
            product.save()

            brand = product.brand
            brand.count = (brand.count - sale_obj.quantity) if brand.count is not None else sale_obj.quantity
            brand.stock = brand.stock - sale_obj.quantity * product.unit_price
            brand.save()
        transaction.calculate_total_amount()
        return transaction

    def update(self, instance, validated_data):
        sales_data = validated_data.pop('sales', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        with transaction.atomic():
            existing_sales = {sale.id: sale for sale in instance.sales.all()}
            new_sales_ids = []

            for sale_data in sales_data:
                sale_id = sale_data.get('id', None)
                if sale_id and sale_id in existing_sales:
                    sale_instance = existing_sales[sale_id]
                    old_product = sale_instance.product
                    old_quantity = sale_instance.quantity or 0
                    new_product = sale_data.get('product', old_product)
                    new_quantity = sale_data.get('quantity', old_quantity) or 0

                    if old_product != new_product:
                        old_product.count = (old_product.count or 0) + old_quantity
                        old_product.stock = (old_product.stock or 0) + old_quantity * (old_product.unit_price or 0)
                        old_product.save()
                        old_brand = old_product.brand
                        old_brand.count = (old_brand.count or 0) + old_quantity
                        old_brand.stock = (old_brand.stock or 0) + old_quantity * (old_product.unit_price or 0)
                        old_brand.save()

                        new_product_instance = Product.objects.get(id=new_product.id)
                        new_product_instance.count = (new_product_instance.count or 0) - new_quantity
                        new_product_instance.stock = (new_product_instance.stock or 0) - new_quantity * (new_product_instance.unit_price or 0)
                        new_product_instance.save()
                        new_brand = new_product_instance.brand
                        new_brand.count = (new_brand.count or 0) - new_quantity
                        new_brand.stock = (new_brand.stock or 0) - new_quantity * (new_product_instance.unit_price or 0)
                        new_brand.save()
                    else:
                        quantity_diff = (new_quantity or 0) - (old_quantity or 0)
                        stock_diff = quantity_diff * (old_product.unit_price or 0)
                        old_product.count = (old_product.count or 0) - quantity_diff
                        old_product.stock = (old_product.stock or 0) - stock_diff
                        old_product.save()
                        old_brand = old_product.brand
                        old_brand.count = (old_brand.count or 0) - quantity_diff
                        old_brand.stock = (old_brand.stock or 0) - stock_diff
                        old_brand.save()

                    for attr, value in sale_data.items():
                        setattr(sale_instance, attr, value)
                    sale_instance.save()
                    new_sales_ids.append(sale_instance.id)
                    del existing_sales[sale_id]
                else:
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

            for sale in existing_sales.values():
                old_product = sale.product
                old_quantity = sale.quantity or 0
                old_product.count = (old_product.count or 0) + old_quantity
                old_product.stock = (old_product.stock or 0) + old_quantity * (old_product.unit_price or 0)
                old_product.save()
                old_brand = old_product.brand
                old_brand.count = (old_brand.count or 0) + old_quantity
                old_brand.stock = (old_brand.stock or 0) + old_quantity * (old_product.unit_price or 0)
                old_brand.save()
                sale.delete()

            instance.calculate_total_amount()
            instance.total_amount = sum((sale.total_price or 0) for sale in instance.sales.all())
            instance.save()

        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation


class VendorTransactionSerialzier(serializers.ModelSerializer):
    date = serializers.DateField()
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = VendorTransactions
        fields = '__all__'

    def get_vendor_name(self, obj):
        return obj.vendor.name

    def create(self, validated_data):
        transaction_obj = VendorTransactions.objects.create(**validated_data)
        vendor = transaction_obj.vendor
        vendor.due = (vendor.due - transaction_obj.amount) if vendor.due is not None else -transaction_obj.amount
        vendor.save()
        return transaction_obj

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

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation


class VendorBrandSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Brand
        fields = '__all__'

    def get_count(self, obj):
        vendors = Vendor.objects.filter(enterprise=obj.enterprise, brand=obj).count()
        return vendors


class PurchaseReturnSerializer(serializers.ModelSerializer):
    purchase_transaction = PurchaseTransactionSerializer(read_only=True)
    purchases = PurchaseSerializer(many=True, read_only=True)
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
    # Include the new branch field
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.all())

    class Meta:
        model = PurchaseReturn
        fields = [
            'id',
            'date',
            'enterprise',
            'branch',
            'purchase_transaction',
            'purchase_transaction_id',  # for writes
            'purchases',                # for reads
            'purchase_ids'              # for writes
        ]

    @transaction.atomic
    def create(self, validated_data):
        purchase_ids = validated_data.pop('purchase_ids', [])
        purchase_return = PurchaseReturn.objects.create(**validated_data)
        vendor = purchase_return.purchase_transaction.vendor
        total_unit_price = 0

        for purchase in purchase_ids:
            purchase.purchase_return = purchase_return
            purchase.returned = True
            purchase.save()
            total_unit_price += purchase.unit_price * purchase.quantity
            product = purchase.product
            product.count = (product.count - purchase.quantity) if product.count is not None else purchase.quantity
            product.save()

        vendor.due = (vendor.due or 0) - total_unit_price
        vendor.save()
        return purchase_return

    def delete(self, instance):
        purchases = instance.purchases.all()
        vendor = instance.purchase_transaction.vendor
        total_unit_price = 0

        for purchase in purchases:
            purchase.returned = False
            purchase.save()
            total_unit_price += purchase.unit_price * purchase.quantity
            # Fix: update product.count instead of non-existent product.quantity
            product = purchase.product
            product.count = (product.count + purchase.quantity) if product.count is not None else purchase.quantity
            product.save()

        vendor.due += total_unit_price
        vendor.save()
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
        transaction_obj = StaffTransactions.objects.create(**validated_data)
        staff = transaction_obj.staff
        staff.due = (staff.due - transaction_obj.amount) if staff.due is not None else -transaction_obj.amount
        staff.save()
        return transaction_obj

    def update(self, instance, validated_data):
        old_staff = instance.staff
        old_amount = instance.amount
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.refresh_from_db()
        new_staff = instance.staff

        if old_staff == new_staff:
            new_staff.due = new_staff.due - instance.amount + old_amount
            new_staff.save()
        else:
            old_staff.due = old_staff.due + old_amount
            new_staff.due = new_staff.due - instance.amount
            old_staff.save()
            new_staff.save()

        return instance

    def get_staff_name(self, obj):
        return obj.staff.name
