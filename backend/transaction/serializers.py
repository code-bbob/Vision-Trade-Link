from rest_framework import serializers
from .models import Vendor, Phone, Purchase, PurchaseTransaction,Sales, SalesTransaction,Scheme,Subscheme,Item, PriceProtection
from inventory.models import Brand
from django.db import transaction
from .models import VendorTransaction


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
        fields = ['id','date', 'vendor', 'vendor_name', 'total_amount', 'purchase', 'enterprise','bill_no']

    def create(self, validated_data):
        purchase_data = validated_data.pop('purchase')
        transaction = PurchaseTransaction.objects.create(**validated_data)
        for data in purchase_data:
            Purchase.objects.create(purchase_transaction=transaction, **data)

        amount = transaction.calculate_total_amount()
        vendor = transaction.vendor
        brand = vendor.brand
        vendor.due = (vendor.due + amount) if vendor.due is not None else amount
        brand.stock = (brand.stock + amount) if brand.stock is not None else amount
        brand.save()
        vendor.save()
        return transaction
    
    def update(self, instance, validated_data):

        old_vendor = instance.vendor
        old_brand = old_vendor.brand
        old_total = instance.total_amount

        instance.vendor = validated_data.get('vendor', instance.vendor)
        instance.date = validated_data.get('date', instance.date)
        instance.enterprise = validated_data.get('enterprise', instance.enterprise)
        instance.total_amount = validated_data.get('total_amount', instance.total_amount)
        instance.bill_no = validated_data.get('bill_no', instance.bill_no)
        instance.save()

        new_vendor = instance.vendor
        new_brand = new_vendor.brand

        purchase_data = validated_data.get('purchase')
        if purchase_data:
            existing_purchases = {purchase.id: purchase for purchase in instance.purchase.all()}
            
            for purchase_item in purchase_data:
                purchase_id = purchase_item.get('id')
                
                if purchase_id and purchase_id in existing_purchases:
                    print("Same same $$$$$$$$$$$$$$$$$$$")
                    purchase_instance = existing_purchases[purchase_id]

                    old_imei = purchase_instance.imei_number
                    new_imei = purchase_item.get('imei_number')
                    if old_imei != new_imei:
                        item = Item.objects.filter(imei_number=old_imei).first()
                        item.imei_number = new_imei
                        item.save()
                    new_phone = purchase_item.get('phone')
                    old_phone = purchase_instance.phone

                    if new_phone!=old_phone:
                        item = Item.objects.filter(imei_number=new_imei).first()
                        item.phone = new_phone
                        item.save()
                        item.phone.save()
                        old_phone.save()
                 
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
        if old_vendor != new_vendor:
            old_vendor.due = (old_vendor.due - old_total) if old_vendor.due is not None else 0
            new_vendor.due = (new_vendor.due + instance.total_amount) if new_vendor.due is not None else instance.total_amount
            old_vendor.save()
            new_vendor.save()
        else:
            new_vendor.due = (new_vendor.due + instance.total_amount - old_total) if new_vendor.due is not None else instance.total_amount
            new_vendor.save()
        
        if new_brand != old_brand:
            old_brand.stock = (old_brand.stock - old_total) if old_brand.stock is not None else 0
            new_brand.stock = (new_brand.stock + instance.total_amount) if new_brand.stock is not None else instance.total_amount
            old_brand.save()
            new_brand.save()
        else:
            new_brand.stock = (new_brand.stock + instance.total_amount - old_total) if new_brand.stock is not None else instance.total_amount
            new_brand.save()
        purchases = instance.purchase.all()
        for purchase in purchases:
            sales = Sales.objects.filter(imei_number = purchase.imei_number).first()
            if sales:
                sales.checkit()
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
        fields = ['id','date', 'total_amount', 'sales','enterprise','name','phone_number','bill_no']

    def create(self, validated_data):
        sales_data = validated_data.pop('sales')
        transaction = SalesTransaction.objects.create(**validated_data)
        for data in sales_data:
            sale = Sales.objects.create(sales_transaction=transaction, **data)
            sale.phone.calculate_quantity()
            brand = sale.phone.brand
            purchase = Purchase.objects.filter(imei_number = sale.imei_number).first()
            brand.stock = (brand.stock - purchase.unit_price) if brand.stock is not None else 0
            brand.save()


        transaction.calculate_total_amount()
        return transaction
    
    
        
    def update(self, instance, validated_data):

        print(validated_data)
        

        instance.date = validated_data.get('date', instance.date)
        instance.name = validated_data.get('name', instance.name)
        instance.total_amount = validated_data.get('total_amount', instance.total_amount)
        instance.bill_no = validated_data.get('bill_no',instance.bill_no)
        instance.phone_number = validated_data.get('phone_number',instance.phone_number)

        instance.save()



        sales_data = validated_data.get('sales')
        if sales_data:
            existing_sales = {sale.id: sale for sale in instance.sales.all()}

            for sales in instance.sales.all():
                brand = sales.phone.brand
                brand.stock = (brand.stock + sales.unit_price) if brand.stock is not None else sales.unit_price
                brand.save()

            
            for sale_item in sales_data:
                sale_id = sale_item.get('id')
                if sale_id and sale_id in existing_sales:
                    print("Same same $$$$$$$$$$$$$$$$$$$")
                    sales_instance = existing_sales[sale_id]
                    
                    old_imei = sales_instance.imei_number
                    new_imei = sale_item.get('imei_number')
                    if old_imei != new_imei:
                        item = Item.objects.create(imei_number = old_imei, phone = sales_instance.phone)
                        # Item.objects.filter(imei_number = new_imei).delete()

                    for attr, value in sale_item.items():   
                        setattr(sales_instance, attr, value)
                    sales_instance.save()
                    sales_instance.phone.calculate_quantity()
                    print(sales_instance)
                    del existing_sales[sale_id]
                else:
                    print("Creating new purchase instance")
                    new_sale = Sales(sales_transaction=instance, **sale_item)
                    new_sale.save()
                    new_sale.phone.calculate_quantity()
                    print("New purchase instance created")

            for sale in existing_sales.values():
                print("Here")
                item = Item.objects.create(imei_number=sale.imei_number,phone=sale.phone)
                sale.phone.quantity+=1
                sale.phone.save()
                print(item)
                sale.delete()

        instance.total_amount = instance.calculate_total_amount()
        instance.save()

        sales = instance.sales.all()
        print("here",sales)
        for sale in sales:
            brand = sale.phone.brand
            purchase = Purchase.objects.filter(imei_number = sale.imei_number).first()
            brand.stock = (brand.stock - purchase.unit_price) if brand.stock is not None else 0
            brand.save()
            sale.checkit()
            print("Done Checking")
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
        fields = ['id','lowerbound','upperbound','cashback']
    
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

        enterprise = scheme.enterprise


        sales = Sales.objects.filter(sales_transaction__enterprise = enterprise, sales_transaction__date__gte=scheme.from_date,sales_transaction__date__lte=scheme.to_date )
        print(sales)
        for sale in sales:
            sale.checkit()
        scheme.calculate_receivable()

        return scheme
    
    def update(self, instance, validated_data):
        with transaction.atomic():
            # Update Scheme fields
            for attr, value in validated_data.items():
                if attr != 'subscheme':
                    setattr(instance, attr, value)
            instance.save()

            # Handle Subschemes
            subschemes_data = validated_data.get('subscheme', [])
            existing_subschemes = {subscheme.id: subscheme for subscheme in instance.subscheme.all()}

            # Update or create subschemes
            for subscheme_data in subschemes_data:
                subscheme_id = subscheme_data.get('id')
                if subscheme_id and subscheme_id in existing_subschemes:
                    # Update existing subscheme
                    subscheme = existing_subschemes.pop(subscheme_id)
                    for attr, value in subscheme_data.items():
                        setattr(subscheme, attr, value)
                    subscheme.save()
                else:
                    # Create new subscheme
                    Subscheme.objects.create(scheme=instance, **subscheme_data)

            # Delete subschemes not present in the update data
            for subscheme in existing_subschemes.values():
                subscheme.delete()

            # Recalculate receivable if necessary
            enterprise = instance.enterprise.id


            sales = Sales.objects.filter(sales_transaction__enterprise = enterprise, sales_transaction__date__gte=instance.from_date,sales_transaction__date__lte=instance.to_date )
            other_sales = instance.sales.all()
            print(other_sales)
            print(sales)
            sales = sales.union(other_sales)
            print(sales)
            for sale in sales:
                sale.checkit()
            instance.calculate_receivable()
        

        return instance


    
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


    def create(self, validated_data):
        pp = PriceProtection.objects.create(**validated_data)
        sales = Sales.objects.filter(sales_transaction__enterprise = pp.enterprise, sales_transaction__date__gte=pp.from_date,sales_transaction__date__lte=pp.to_date )
        print(sales)
        for sale in sales:
            sale.checkit()
        pp.calculate_receivable()
        return pp
        


    def update(self, instance, validated_data):
        with transaction.atomic():
            # Update PriceProtection fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()

            enterprise = instance.enterprise.id

            sales = Sales.objects.filter(sales_transaction__enterprise = enterprise, sales_transaction__date__gte=instance.from_date,sales_transaction__date__lte=instance.to_date )
            other_sales = instance.sales.all()
            print(other_sales)
            print(sales)
            sales = sales.union(other_sales)
            print(sales)
            for sale in sales:
                sale.checkit()
                self.calculate_receivable(instance)
            instance.calculate_receivable()
            return instance
    
    def calculate_receivable(self, instance):
        # Calculate receivable based on price drop and number of sales
        sales_count = instance.sales.count()
        instance.receivable = instance.price_drop * sales_count
        instance.save()
    
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
    

class VendorTransactionSerializer(serializers.ModelSerializer):
    date = serializers.DateTimeField()
    vendor_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = VendorTransaction
        fields = '__all__'

    def create(self, validated_data):
        vendor = validated_data['vendor']
        amount = validated_data['amount']

        vendor.due = (vendor.due - amount) if vendor.due is not None else 0
        vendor.save()

        transaction = VendorTransaction.objects.create(**validated_data)
        return transaction
    
    def update(self, instance, validated_data):
        print("HERE")
        old_vendor = instance.vendor
        old_amount = instance.amount
        
        instance.vendor = validated_data.get('vendor', instance.vendor)
        instance.date = validated_data.get('date', instance.date)
        instance.amount = validated_data.get('amount', instance.amount)
        instance.desc = validated_data.get('desc', instance.desc)
        instance.method = validated_data.get('method', instance.method)
        instance.cheque_number = validated_data.get('cheque_number', instance.cheque_number)
        instance.cashout_date = validated_data.get('cashout_date', instance.cashout_date)
        instance.save()
        new_vendor = instance.vendor
        if old_vendor != new_vendor:
            old_vendor.due = (old_vendor.due + old_amount) if old_vendor.due is not None else old_amount
            new_vendor.due = (new_vendor.due - instance.amount) if new_vendor.due is not None else 0
            old_vendor.save()
            new_vendor.save()
        else:
            new_vendor.due = (new_vendor.due + old_amount - instance.amount) if new_vendor.due is not None else instance.amount
            new_vendor.save()
        return super().update(instance, validated_data)
    

    def get_vendor_name(self,obj):
        return obj.vendor.name

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Format the date in 'YYYY-MM-DD' format for the response
        representation['date'] = instance.date.strftime('%Y-%m-%d')
        return representation