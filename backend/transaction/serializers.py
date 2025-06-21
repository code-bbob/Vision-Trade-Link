from rest_framework import serializers
from .models import Vendor, Phone, Purchase, PurchaseTransaction,Sales, SalesTransaction,Scheme,Subscheme,Item, PriceProtection,PurchaseReturn
from inventory.models import Brand
from django.db import transaction
from .models import VendorTransaction
from django.utils.timezone import localtime
from transaction.models import VendorTransaction


class PurchaseSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Purchase
        fields = ['id','phone', 'imei_number', 'unit_price','phone_name','returned']
        
    def get_phone_name(self,obj):
        return obj.phone.name
    
class PurchaseTransactionSerializer(serializers.ModelSerializer):
    
    purchase = PurchaseSerializer(many=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateTimeField()
   
    class Meta:
        model = PurchaseTransaction
        # fields = ['id','date', 'vendor', 'vendor_name', 'total_amount', 'purchase', 'enterprise','bill_no','method']
        fields = '__all__'

    @transaction.atomic
    def create(self, validated_data):
        
        purchase_data = validated_data.pop('purchase')
        purchase_transaction = PurchaseTransaction.objects.create(**validated_data)
        for purchase in purchase_data:
            purchaseobj = Purchase.objects.create(purchase_transaction=purchase_transaction, **purchase)
            phone = purchaseobj.phone
            phone.count = (phone.count + 1) if phone.count is not None else 1
            phone.stock = (phone.stock + phone.selling_price) if phone.stock is not None else phone.selling_price
            brand = phone.brand
            brand.count = (brand.count + 1) if brand.count is not None else 1
            brand.stock = (brand.stock + phone.selling_price) if brand.stock is not None else phone.selling_price
            phone.save()
            brand.save() 

        amount = purchase_transaction.calculate_total_amount()
        vendor = purchase_transaction.vendor
        VendorTransactionSerializer().create({
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
            vt = VendorTransactionSerializer().create({
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
            VendorTransactionSerializer().create({
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
  
#check to see if the old_method was cash or cheque or credit
#if the method has changed then delete the previous transaction and create a new one
#if not and just ampunt has changed then update the transaction
        old_method = instance.method
        old_vendor = instance.vendor
        old_brand = old_vendor.brand
        old_total = instance.total_amount

        instance.vendor = validated_data.get('vendor', instance.vendor)
        instance.date = validated_data.get('date', instance.date)
        #print(instance.date)
        instance.enterprise = validated_data.get('enterprise', instance.enterprise)
        instance.total_amount = validated_data.get('total_amount', instance.total_amount)
        instance.bill_no = validated_data.get('bill_no', instance.bill_no)
        instance.method = validated_data.get('method', instance.method)
        instance.cheque_number = validated_data.get('cheque_number', instance.cheque_number)
        instance.cashout_date = validated_data.get('cashout_date', instance.cashout_date)
        instance.save()
        #print(instance.date)

        new_vendor = instance.vendor
        new_brand = new_vendor.brand
        new_method = instance.method

        purchase_data = validated_data.get('purchase')
        if purchase_data:
            existing_purchases = {purchase.id: purchase for purchase in instance.purchase.all()}
            
            for purchase_item in purchase_data:
                purchase_id = purchase_item.get('id')
                
                if purchase_id and purchase_id in existing_purchases:
                    #print("Same same $$$$$$$$$$$$$$$$$$$")
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
                    #print("Creating new purchase instance")
                    new_purchase = Purchase(purchase_transaction=instance, **purchase_item)
                    new_purchase.save()
                    #print("New purchase instance created")

            for purchase in existing_purchases.values():
                purchase.delete()

        instance.total_amount = instance.calculate_total_amount()
        instance.save()
        old_vendor.refresh_from_db()
        new_vendor.refresh_from_db()
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

        if old_method != new_method:
            
            if old_method == 'cash' or old_method == 'cheque':
                VendorTransaction.objects.filter(purchase_transaction=instance).first().delete()
                vendor = Vendor.objects.filter(id=instance.vendor.id).first()
            if new_method == 'cash':
                serializer = VendorTransactionSerializer
                data={'vendor': Vendor.objects.filter(id=instance.vendor.id).first(), 'date': instance.date, 'amount': instance.total_amount, 'desc': 'Paid for purchase', 'method': 'cash', 'purchase_transaction': instance,'enterprise':instance.enterprise}
                serializer.create(self,validated_data=data)
            elif new_method == 'cheque':
                serializer = VendorTransactionSerializer
                data={'vendor': Vendor.objects.filter(id=instance.vendor.id).first()    , 'date': instance.date, 'amount': instance.total_amount, 'desc': 'Paid for purchase', 'method': 'cheque', 'cheque_number': instance.cheque_number, 'cashout_date': instance.cashout_date,'enterprise':instance.enterprise, 'purchase_transaction': instance}
                serializer.create(self,validated_data=data)
        else:
            if old_total != instance.total_amount:
                if new_method != 'credit':
                    vendor_transaction = VendorTransaction.objects.filter(purchase_transaction=instance).first()
                    vendor_transaction.amount = instance.total_amount
                    vendor_transaction.save()

        return instance


    def get_vendor_name(self, obj):
        return obj.vendor.name
    
    # def to_representation(self, instance):
    #     representation = super().to_representation(instance)
        
    #     # Format the date in 'YYYY-MM-DD' format for the response
    #     representation['date'] = instance.date.strftime('%Y-%m-%d')
    #     return representation


    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['date'] = localtime(instance.date).strftime('%Y-%m-%d')
        return representation

# class PurchaseTransactionSerializer(serializers.ModelSerializer):
#     purchase = PurchaseSerializer(many=True)
#     vendor_name = serializers.SerializerMethodField(read_only=True)
#     date = serializers.DateTimeField()

#     class Meta:
#         model = PurchaseTransaction
#         fields = '__all__'

#     @transaction.atomic
#     def create(self, validated_data):
#         purchases_data = validated_data.pop('purchase')
#         transaction = PurchaseTransaction.objects.create(**validated_data)

#         # 1) Create all Purchase items (with your IMEI logic)
#         for data in purchases_data:
#             Purchase.objects.create(purchase_transaction=transaction, **data)
#             # (you could also call .checkit() on any Sales here if needed)

#         # 2) Post a “base” VendorTransaction of -amount (increases vendor.due)
#         total = transaction.calculate_total_amount()
#         base_tx = {
#             'vendor': transaction.vendor,
#             'branch': transaction.branch,
#             'enterprise': transaction.enterprise,
#             'date':    transaction.date,
#             'amount': -total,
#             'desc':   f'Purchase made for transaction {transaction.bill_no}',
#             'method': transaction.method,
#             'purchase_transaction': transaction,
#             'type':   'base',
#         }
#         VendorTransactionSerializer().create(validated_data=base_tx)

#         # 3) If paid immediately (cash/cheque), post a matching “payment” TX
#         if transaction.method == 'cash' or transaction.method == 'cheque':
#             pay_tx = {
#                 'vendor': transaction.vendor,
#                 'branch': transaction.branch,
#                 'enterprise': transaction.enterprise,
#                 'date':    transaction.date,
#                 'amount':  total,
#                 'desc':    'Paid for purchase',
#                 'method':  transaction.method,
#                 'purchase_transaction': transaction,
#                 'type':    'payment',
#             }
#             if transaction.method == 'cheque':
#                 pay_tx.update({
#                     'cheque_number': transaction.cheque_number,
#                     'cashout_date':  transaction.cashout_date,
#                 })
#             VendorTransactionSerializer().create(validated_data=pay_tx)

#         return transaction

#     @transaction.atomic
#     def update(self, instance, validated_data):
#         # --- 0) capture old state ---
#         old_vendor = instance.vendor
#         old_method = instance.method
#         old_total  = instance.total_amount or 0

#         # --- 1) update simple fields ---
#         for fld in ('vendor','date','enterprise','bill_no','method','cheque_number','cashout_date'):
#             setattr(instance, fld, validated_data.get(fld, getattr(instance, fld)))
#         instance.save()

#         # --- 2) update nested purchases + your IMEI logic ---
#         purchases_data = validated_data.pop('purchase', None)
#         if purchases_data is not None:
#             existing = {p.id: p for p in instance.purchase.all()}
#             for itm in purchases_data:
#                 pid = itm.get('id')
#                 if pid and pid in existing:
#                     p = existing.pop(pid)
#                     # handle IMEI or phone changes here...
#                     for k,v in itm.items():
#                         setattr(p, k, v)
#                     p.save()
#                 else:
#                     Purchase.objects.create(purchase_transaction=instance, **itm)
#             # delete any removed purchases
#             for p in existing.values():
#                 p.delete()

#         # --- 3) recalc total & save ---
#         instance.total_amount = instance.calculate_total_amount()
#         instance.save()
#         new_total  = instance.total_amount
#         new_vendor = instance.vendor
#         new_method = instance.method

#         # --- 4) base transaction: update vendor or amount if changed ---
#         base_vt = VendorTransaction.objects.filter(
#             purchase_transaction=instance, type='base'
#         ).first()

#         if base_vt:
#             # vendor changed?
#             if old_vendor != new_vendor:
#                 base_vt.vendor = new_vendor
#             # amount changed?
#             if new_total != old_total:
#                 base_vt.amount = -new_total
#             base_vt.save()

#         # --- 5) payment transaction: handle method/vendor/amount changes ---
#         pay_vt = VendorTransaction.objects.filter(
#             purchase_transaction=instance, type='payment'
#         ).first()

#         # if method or vendor switched, delete old payment, then re-create if needed
#         if old_method != new_method or old_vendor != new_vendor:
#             if pay_vt:
#                 pay_vt.delete()
#             if new_method in ('cash','cheque'):
#                 pay_tx = {
#                     'vendor': new_vendor,
#                     'branch': instance.branch,
#                     'enterprise': instance.enterprise,
#                     'date':    instance.date,
#                     'amount':  new_total,
#                     'desc':    'Paid for purchase',
#                     'method':  new_method,
#                     'purchase_transaction': instance,
#                     'type':    'payment',
#                 }
#                 if new_method == 'cheque':
#                     pay_tx.update({
#                         'cheque_number': instance.cheque_number,
#                         'cashout_date':  instance.cashout_date,
#                     })
#                 VendorTransactionSerializer().create(validated_data=pay_tx)

#         # same vendor+method, just update amount if credit !=
#         elif new_method != 'credit' and new_total != old_total and pay_vt:
#             pay_vt.amount = new_total
#             pay_vt.save()

#         return instance

#     def to_representation(self, instance):
#         data = super().to_representation(instance)
#         data['date'] = localtime(instance.date).strftime('%Y-%m-%d')
#         return data

#     def get_vendor_name(self, obj):
#         return obj.vendor.name

  
class VendorSerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField(read_only=True)
    enterprise_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Vendor
        fields = ['id','name', 'brand', 'brand_name', 'due', 'enterprise', 'enterprise_name','branch']
    
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
        fields = ['id','date', 'total_amount', 'sales','enterprise','name','phone_number','bill_no','branch']

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

        #print(validated_data)
        

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
                    #print("Same same $$$$$$$$$$$$$$$$$$$")
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
                    #print(sales_instance)
                    del existing_sales[sale_id]
                else:
                    #print("Creating new purchase instance")
                    new_sale = Sales(sales_transaction=instance, **sale_item)
                    new_sale.save()
                    new_sale.phone.calculate_quantity()
                    #print("New purchase instance created")

            for sale in existing_sales.values():
                #print("Here")
                item = Item.objects.create(imei_number=sale.imei_number,phone=sale.phone)
                sale.phone.quantity+=1
                sale.phone.save()
                #print(item)
                sale.delete()

        instance.total_amount = instance.calculate_total_amount()
        instance.save()

        sales = instance.sales.all()
        #print("here",sales)
        for sale in sales:
            brand = sale.phone.brand
            purchase = Purchase.objects.filter(imei_number = sale.imei_number).first()
            brand.stock = (brand.stock - purchase.unit_price) if brand.stock is not None else 0
            brand.save()
            sale.checkit()
            #print("Done Checking")
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
        fields = ['id','from_date','to_date','phone','enterprise','subscheme','phone_name','receivable','sold','brand','brand_name','status','branch']

    def create(self, validated_data):
        #print("YAHA SAMMA")
        #print(validated_data)
        # Pop subschemes data from validated_data
        subschemes_data = validated_data.pop('subscheme')
        #print("YAHA SAMMA")

        # Create the Scheme instance
        #print(validated_data)
        scheme = Scheme.objects.create(**validated_data)
        #print("Scheme created:", scheme)
        #print("YAHA asdsakdnkasj SAMMA")

        # Now iterate over the subschemes and create each one, setting the scheme
        for subscheme_data in subschemes_data:
            Subscheme.objects.create(scheme=scheme, **subscheme_data)

        enterprise = scheme.enterprise


        sales = Sales.objects.filter(sales_transaction__enterprise = enterprise, sales_transaction__date__gte=scheme.from_date,sales_transaction__date__lte=scheme.to_date )
        #print(sales)
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
            #print(other_sales)
            #print(sales)
            sales = sales.union(other_sales)
            #print(sales)
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
        #print(sales)
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
            #print(other_sales)
            #print(sales)
            sales = sales.union(other_sales)
            #print(sales)
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
        print(vendor.due)
        vendor.due = (vendor.due - amount) if vendor.due is not None else -amount
        print(vendor.due)
        vendor.save()

        transaction = VendorTransaction.objects.create(**validated_data)
        return transaction
    
    def update(self, instance, validated_data):

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
            'enterprise',
            'branch',
            'purchase_transaction',
            'purchase_transaction_id',  # for write
            'purchases',       # for read
            'purchase_ids'     # for write
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
        #print(purchase_ids)

        # Attach each purchase to this return
        for purchase in purchase_ids:

            purchase.purchase_return = purchase_return
            purchase.returned = True
            purchase.save()
            total_unit_price += purchase.unit_price
            product = purchase.phone
            product.count = (product.count - 1) if product.count is not None else -1
            product.stock = (product.stock -  product.selling_price) if product.stock is not None else - product.selling_price
            brand = product.brand
            brand.count = (brand.count - 1) if brand.count is not None else -1
            brand.stock = (brand.stock - product.selling_price) if brand.stock is not None else - product.selling_price
            brand.save()
            product.save()
            item = Item.objects.filter(imei_number=purchase.imei_number).first()
            phone = item.phone
            item.delete()
            phone.calculate_quantity()


        # Update vendor dues if needed
        if vendor.due is None:
            vendor.due = 0

        VendorTransactionSerializer().create({
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
            total_unit_price += purchase.unit_price
            item = Item.objects.create(imei_number=purchase.imei_number,phone=purchase.phone)
            purchase.phone.calculate_quantity()
            purchase.phone.stock = (purchase.phone.stock + purchase.phone.selling_price) if purchase.phone.stock is not None else purchase.phone.selling_price
            purchase.phone.brand.count = (purchase.phone.brand.count + 1) if purchase.phone.brand.count is not None else 1
            purchase.phone.brand.stock = (purchase.phone.brand.stock + purchase.phone.selling_price) if purchase.phone.brand.stock is not None else purchase.phone.selling_price
            purchase.phone.brand.save()
            purchase.phone.save()
            
        vt = VendorTransaction.objects.filter(purchase_transaction=instance.purchase_transaction,type="return").first()
        print(vt)   
        vt.delete()
        instance.delete()
        return instance
    


