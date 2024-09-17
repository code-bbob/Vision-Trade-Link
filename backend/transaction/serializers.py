from rest_framework import serializers
from .models import Vendor, Phone, Purchase, PurchaseTransaction,Sales, SalesTransaction,Scheme,Subscheme,Item, PriceProtection
from inventory.models import Brand
from django.db import transaction

class PurchaseSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Purchase
        fields = ['id','phone', 'imei_number', 'unit_price','phone_name']
        
    def get_phone_name(self,obj):
        return obj.phone.name
    
class PurchaseTransactionSerializer(serializers.ModelSerializer):
    
    purchase = PurchaseSerializer(many=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateTimeField()

    class Meta:
        model = PurchaseTransaction
        fields = ['id','date', 'vendor', 'vendor_name', 'total_amount', 'purchase', 'enterprise']

    def create(self, validated_data):
        purchase_data = validated_data.pop('purchase')
        transaction = PurchaseTransaction.objects.create(**validated_data)
        for data in purchase_data:
            Purchase.objects.create(purchase_transaction=transaction, **data)

        amount = transaction.calculate_total_amount()
        vendor = transaction.vendor
        vendor.due = (vendor.due + amount) if vendor.due is not None else amount
        vendor.save()
        return transaction
    
    def update(self, instance, validated_data):

        print(validated_data)
        instance.vendor = validated_data.get('vendor', instance.vendor)
        instance.date = validated_data.get('date', instance.date)
        instance.enterprise = validated_data.get('enterprise', instance.enterprise)
        instance.total_amount = validated_data.get('total_amount', instance.total_amount)
        instance.save()

        purchase_data = validated_data.get('purchase')
        if purchase_data:
            existing_purchases = {purchase.id: purchase for purchase in instance.purchase.all()}
            
            for purchase_item in purchase_data:
                purchase_id = purchase_item.get('id')
                
                if purchase_id and purchase_id in existing_purchases:
                    print("Same same $$$$$$$$$$$$$$$$$$$")
                    purchase_instance = existing_purchases[purchase_id]
                    for attr, value in purchase_item.items():
                        setattr(purchase_instance, attr, value)
                    purchase_instance.save()
                    del existing_purchases[purchase_id]
                else:
                    print("Creating new purchase instance")
                    new_purchase = Purchase(purchase_transaction=instance, **purchase_item)
                    new_purchase.save()
                    print("New purchase instance created")

            for purchase in existing_purchases.values():
                purchase.delete()

        instance.total_amount = instance.calculate_total_amount()
        instance.save()

        return instance


    def get_vendor_name(self, obj):
        return obj.vendor.name
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Format the date in 'YYYY-MM-DD' format for the response
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation

class VendorSerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField(read_only=True)
    enterprise_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Vendor
        fields = ['id','name', 'brand', 'brand_name', 'due', 'enterprise', 'enterprise_name']
    
    def get_brand_name(self, obj):
        return obj.brand.name
    
    def get_enterprise_name(self, obj):
        return obj.enterprise.name

class SalesSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Sales
        fields = ['id','phone', 'imei_number', 'unit_price','phone_name']
    
    def get_phone_name(self,obj):
        return obj.phone.name

class SalesTransactionSerializer(serializers.ModelSerializer):
    sales = SalesSerializer(many=True)

    class Meta:
        model = SalesTransaction
        fields = ['id','date', 'total_amount', 'sales','enterprise','name']

    def create(self, validated_data):
        sales_data = validated_data.pop('sales')
        transaction = SalesTransaction.objects.create(**validated_data)
        for data in sales_data:
            Sales.objects.create(sales_transaction=transaction, **data)
        transaction.calculate_total_amount()
        return transaction
    
    
    def update(self, instance, validated_data):
        sales_data = validated_data.pop('sales', [])
        print(sales_data)

        # Update SalesTransaction fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle sales updates
        with transaction.atomic():
            existing_sales = {sale.id: sale for sale in instance.sales.all()}
            
            for sale_item in sales_data:
                sale_id = sale_item.get('id')
                
                if sale_id and sale_id in existing_sales:
                    print("UPTO HERE")
                    # Update existing sale
                    # sale = existing_sales.pop(sale_id)
                    sale = existing_sales[sale_id]

                    old_imei = sale.imei_number
                    new_imei = sale_item.get('imei_number')

                    if old_imei != new_imei:
                        # IMEI has changed, handle item creation/deletion
                        self._handle_imei_change(old_imei, new_imei, sale_item['phone'])

                    # Update sale object
                    for attr, value in sale_item.items():
                        setattr(sale, attr, value)
                    sale.save()
                    del existing_sales[sale_id]

                    print(sale)
                else:
                    # Create new sale
                    print("AT ELSE")
                    new_sale = Sales.objects.create(sales_transaction=instance, **sale_item)
                    print(new_sale)
                    self._handle_new_sale(new_sale)

            # Delete sales not present in the update data
            for sale in existing_sales.values():
                self._handle_sale_deletion(sale)
                sale.delete()

        # Recalculate total amount
        instance.calculate_total_amount()
        instance.save()

        return instance
    

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Format the date in 'YYYY-MM-DD' format for the response
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation
    # def get_vendor_name(self, obj):
    #     return obj.vendor.name

    def _handle_new_sale(self, sale):
        # Delete item for the sold phone
        Item.objects.filter(imei_number=sale.imei_number).delete()

        # Update phone quantity
        phone = sale.phone
        phone.quantity -= 1
        phone.save()

    def _handle_sale_deletion(self, sale):
        # Create item for the returned phone
        Item.objects.create(imei_number=sale.imei_number, phone=sale.phone)

        # Update phone quantity
        phone = sale.phone
        phone.quantity += 1
        phone.save()

class SubSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscheme
        fields = ['lowerbound','upperbound','cashback']
    
class SchemeSerializer(serializers.ModelSerializer):
    subscheme = SubSchemeSerializer(many=True)
    phone_name = serializers.SerializerMethodField(read_only = True)
    sold = serializers.SerializerMethodField(read_only=True)
    brand_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Scheme
        fields = ['id','from_date','to_date','phone','enterprise','subscheme','phone_name','receivable','sold','brand','brand_name','status']

    def create(self, validated_data):
        print("YAHA SAMMA")
        print(validated_data)
        # Pop subschemes data from validated_data
        subschemes_data = validated_data.pop('subscheme')
        print("YAHA SAMMA")

        # Create the Scheme instance
        print(validated_data)
        scheme = Scheme.objects.create(**validated_data)
        print("Scheme created:", scheme)
        print("YAHA asdsakdnkasj SAMMA")

        # Now iterate over the subschemes and create each one, setting the scheme
        for subscheme_data in subschemes_data:
            Subscheme.objects.create(scheme=scheme, **subscheme_data)

        return scheme
    
    def get_phone_name(self,obj):
        return obj.phone.name
    
    def get_sold(self,obj):
        return obj.sales.count()
    
    def get_brand_name(self,obj):
        return obj.brand.name


class PriceProtectionSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only = True)
    sold = serializers.SerializerMethodField(read_only=True)
    brand_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PriceProtection
        fields = '__all__'
    
    def get_phone_name(self,obj):
        return obj.phone.name
    
    def get_sold(self,obj):
        return obj.sales.count()
    
    def get_brand_name(self,obj):
        return obj.brand.name
    
class VendorBrandSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField(read_only = True)

    class Meta:
        model = Brand
        fields = '__all__'
    
    def get_count(self,obj):
        vendors = Vendor.objects.filter(enterprise = obj.enterprise, brand = obj).count()
        return vendors