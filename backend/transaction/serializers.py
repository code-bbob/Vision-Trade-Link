from rest_framework import serializers
from .models import Vendor, Phone, Purchase, PurchaseTransaction,Sales, SalesTransaction,Scheme,Subscheme,Item, PriceProtection

class PurchaseSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Purchase
        fields = ['phone', 'imei_number', 'unit_price','phone_name']
    
    
    def get_phone_name(self,obj):
        return obj.phone.name
class PurchaseTransactionSerializer(serializers.ModelSerializer):
    purchase = PurchaseSerializer(many=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateTimeField()

    class Meta:
        model = PurchaseTransaction
        fields = ['date', 'vendor', 'vendor_name', 'total_amount', 'purchase', 'enterprise']

    def create(self, validated_data):
        purchase_data = validated_data.pop('purchase')
        transaction = PurchaseTransaction.objects.create(**validated_data)
        for data in purchase_data:
            Purchase.objects.create(purchase_transaction=transaction, **data)
        
        transaction.calculate_total_amount()
        return transaction

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
    class Meta:
        model = Sales
        fields = ['phone', 'imei_number', 'unit_price']

class SalesTransactionSerializer(serializers.ModelSerializer):
    sales = SalesSerializer(many=True)

    class Meta:
        model = SalesTransaction
        fields = ['date', 'total_amount', 'sales','enterprise']

    def create(self, validated_data):
        sales_data = validated_data.pop('sales')
        transaction = SalesTransaction.objects.create(**validated_data)
        for data in sales_data:
            Sales.objects.create(sales_transaction=transaction, **data)
        transaction.calculate_total_amount()
        return transaction
    
    # def get_vendor_name(self, obj):
    #     return obj.vendor.name

class SubSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscheme
        fields = ['lowerbound','upperbound','cashback']
    
class SchemeSerializer(serializers.ModelSerializer):
    subscheme = SubSchemeSerializer(many=True)
    
    class Meta:
        model = Scheme
        fields = ['from_date','to_date','phone','enterprise','subscheme']

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


class PriceProtectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceProtection
        fields = '__all__'