from django.db import models
from inventory.models import Brand, Phone,Item
from enterprise.models import Enterprise

class Vendor(models.Model):
    name = models.CharField(max_length=50)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    due = models.FloatField(null=True, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    cashback = models.FloatField(null=True,blank=True)

    def __str__(self):
        return self.name

class PurchaseTransaction(models.Model):
    date = models.DateTimeField()
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    total_amount = models.FloatField(null=True, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)

    def calculate_total_amount(self):
        total = sum(purchase.unit_price for purchase in self.purchase.all())
        self.total_amount = total
        self.save()
        return self.total_amount
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    def delete(self, *args, **kwargs):
        for purchase in self.purchase.all():
            purchase.delete()  # This will trigger the custom delete logic in Purchase
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return f"Transaction on {self.date} with {self.vendor}"

class Purchase(models.Model):
    phone = models.ForeignKey(Phone, on_delete=models.CASCADE)
    # quantity = models.IntegerField()
    imei_number = models.CharField(max_length=20)
    unit_price = models.FloatField()
    purchase_transaction = models.ForeignKey(PurchaseTransaction, related_name="purchase", on_delete=models.CASCADE) ###relatedname here 
    
    def __str__(self):
        return f" {self.phone} @ {self.unit_price}"
    
    def save(self, *args, **kwargs):
        print("ATLEAST HERE")
        if self.pk is None:  # Only update stock for new purchases
            print("HI I AM HERE")
            print("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
            if isinstance(self.phone, int):
                phone = Phone.objects.get(id=self.phone)
            else:
                phone = self.phone
            print("in self.phone before section",phone.quantity)

            phone.quantity = (phone.quantity + 1) if phone.quantity is not None else 1
            print("in self.phone section",phone.quantity)
            item = Item.objects.create(imei_number = self.imei_number,phone=self.phone)
            print(item)
            phone.save()

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        print("Delete method called for Purchase")
        item = Item.objects.filter(imei_number=self.imei_number).first()
        if item:
            print("Deleting related item")
            item.delete()
            phone = Phone.objects.filter(id = self.phone.id).first()
            phone.quantity -= 1
            phone.save()
        super().delete(*args, **kwargs)


class SalesTransaction(models.Model):
    date = models.DateTimeField()
    # vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    name = models.CharField(max_length=30)
    total_amount = models.FloatField(null=True, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)

    def calculate_total_amount(self):
        print("Ya samma ayo")
        total = sum(sale.unit_price for sale in self.sales.all())
        print(total)
        self.total_amount = total
        self.save()
        return self.total_amount    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    
    # def checkit(self):
    #     sales = self.sales.all()
    #     scheme_list = []
    #     for sale in sales:
    #         print(f"Checking for phone: {sale.phone} on date: {self.date}")
    #         schemes = Scheme.objects.filter(
    #             phone=sale.phone, 
    #             from_date__lte=self.date, 
    #             to_date__gte=self.date
    #         )
    #         if schemes.exists():
    #             for scheme in schemes:
    #                 scheme.sales.add(sale)
    #                 scheme.calculate_receivable()
    #                 scheme.save()
    #             scheme_list.append(scheme)
    #         else:
    #             print("No matching scheme found.")
    #     print(scheme_list)
    #     price_protection = []
    #     for sale in sales:
    #         print(f"Checking pp for phone: {sale.phone} on date: {self.date}")
    #         pps = PriceProtection.objects.filter(phone = sale.phone,from_date__lte = self.date,to_date__gte = self.date)
    #         if pps.exists():
    #             for pp in pps:
    #                 pp.sales.add(sale)
    #                 pp.calculate_receivable()
    #                 pp.save()
    #                 price_protection.append(pp)
    #         print(price_protection)

    def __str__(self):
        return f"Transaction on {self.date} with "
    
class Sales(models.Model):
    phone = models.ForeignKey(Phone, on_delete=models.CASCADE)
    # quantity = models.IntegerField()
    imei_number = models.CharField(max_length=20)
    unit_price = models.FloatField()
    profit = models.FloatField(null=True,blank=True)
    sales_transaction = models.ForeignKey(SalesTransaction, related_name="sales", on_delete=models.CASCADE) ###relatedname here esma j xa uta serializer ma tei nai hunu prxa
    
    def __str__(self):
        return f"{self.phone} @ {self.unit_price}"
    
    def save(self, *args, **kwargs):
        if self.pk:
            self.checkit()
            super().save(*args, **kwargs)
        if self.pk is None:  # Only update stock for new purchases
            self.phone.quantity = (self.phone.quantity - 1) if self.phone.quantity is not None else self.phone.quantity
            # item = Item.objects.get(imei_number = self.imei_number)
            self.phone.save()
            self.checkit()
            purchase = Purchase.objects.filter(imei_number = self.imei_number).first()
            print(purchase.unit_price)
            self.profit = self.unit_price - purchase.unit_price
            print("YAHA SAMMA")
            self.save()

    def checkit(self, *args, **kwargs):
        print(f"Checking for phone: {self.phone} on date: {self.sales_transaction.date}")
        
        # Ensure the sales instance is saved before adding it to schemes
        if not self.pk:
            super().save(*args, **kwargs)
        
        schemes = Scheme.objects.filter(
            phone=self.phone, 
            from_date__lte=self.sales_transaction.date, 
            to_date__gte=self.sales_transaction.date
        )
        
        if schemes.exists():
            for scheme in schemes:
                scheme.sales.add(self)  # Now the sales instance has a valid pk
                scheme.calculate_receivable()
                scheme.save()
        
        else:
            print("No matching scheme found.")
            scheme = Scheme.objects.filter(sales=self).first()
            if scheme:
                print("This is the scheme",scheme)
                scheme.sales.remove(self)
                scheme.calculate_receivable()
        
        print(f"Checking pp for phone: {self.phone} on date: {self.sales_transaction.date}")
        print(self.sales_transaction.date)
        purchase_date = Purchase.objects.filter(imei_number = self.imei_number).first().purchase_transaction.date
        pps = PriceProtection.objects.filter(enterprise=self.sales_transaction.enterprise,phone=self.phone, from_date__lte=self.sales_transaction.date, to_date__gte=self.sales_transaction.date)
        if not pps:
            pp = PriceProtection.objects.filter(sales=self).first()
            if pp:
                print("((((((((((((((((((((((((((((((yes))))))))))))))))))))))))))))))")
                pp.sales.remove(self)
                pp.calculate_receivable()
                pp.save()
            print("here balblabla",pps)
        for pp in pps:
            print(pp.sales.all())
            print(self)
            if self in pp.sales.all():
                print("YES#################")
                pp.sales.remove(self)
                pp.calculate_receivable()
        if pps:
            print("from here",pps.first().from_date)
        pps = pps.filter(from_date__gte = purchase_date)
        print(purchase_date)
        print("here pps",pps)
        if pps.exists():
            for pp in pps:
                pp.sales.add(self)
                print("HERE")
                print(self.phone.item.first())
                pp_item = PPItems.objects.create(pp=pp, phone=self.phone,imei_number = self.imei_number)
                print(pp_item)
                print(pp_item.id)
                print("NOT HERE")
                pp_item.save()
                pp.save()
                pp.calculate_receivable()
        print("here is the problem")
        item = Item.objects.filter(imei_number = self.imei_number).first()
        if item:
            item.delete()
        super().save(*args, **kwargs)  # Save again after processing the schemes and pp


class Scheme(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
    ]
    from_date = models.DateField()
    to_date = models.DateField()
    phone = models.ForeignKey(Phone,on_delete=models.CASCADE, related_name='scheme_phones')
    sales = models.ManyToManyField(Sales,related_name="scheme",blank=True)  #error was here
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name='scheme_enterprise')
    receivable = models.IntegerField(null = True)
    brand = models.ForeignKey(Brand, related_name="scheme_brand", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    def calculate_receivable(self):
        sales = self.sales.all()
        # print(f"HIIII asjd jka dk sa {purchases}")
        count = sales.count()
        print(count)
        subscheme = self.subscheme.filter(lowerbound__lte=count, upperbound__gte=count).first()
        if subscheme:
            self.receivable = subscheme.cashback * count
        else:
            self.receivable = 0
        self.save()
    
    def __str__(self):
        return f"{self.phone} from {self.from_date} to {self.to_date}"


class Subscheme(models.Model):
    lowerbound = models.IntegerField()
    upperbound = models.IntegerField()
    cashback = models.FloatField()
    scheme = models.ForeignKey(Scheme,on_delete=models.CASCADE, related_name='subscheme') #related name here


    def __str__(self):
        return f"{self.lowerbound} to {self.upperbound} => {self.cashback}"
    
class MoneyScheme(models.Model):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
    ]
    from_date = models.DateField()
    to_date = models.DateField()
    phone = models.ForeignKey(Phone,on_delete=models.CASCADE, related_name='moneyscheme_phones')
    sales = models.ManyToManyField(Sales,related_name="moneyscheme",blank=True)  #error was here
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name='moneyscheme_enterprise')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    receivable = models.IntegerField(null = True)

    def calculate_receivable(self):
        sales = self.sales.all()
        count = sales.count()
        print(count)
        self.save()
    
    def __str__(self):
        return f"{self.phone} from {self.from_date} to {self.to_date}"


class MoneySubscheme(models.Model):
    lowerbound = models.FloatField()
    upperbound = models.IntegerField()
    percentage_cashback = models.FloatField()
    scheme = models.ForeignKey(MoneyScheme,on_delete=models.CASCADE, related_name='moneysubscheme') #related name here

    def __str__(self):
        return f"{self.lowerbound} to {self.upperbound} => {self.cashback}"
# Register your signal handlers to calculate the total amount after saving a PurchaseTransaction


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Purchase)
def update_total_amount(sender, instance, **kwargs):
    instance.purchase_transaction.calculate_total_amount()


class PriceProtection(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
    ]
    from_date = models.DateField(null=True)
    to_date = models.DateField(null = True)
    price_drop = models.FloatField()
    sales = models.ManyToManyField(Sales, related_name="priceprotection_sales",blank=True)
    phone = models.ForeignKey(Phone,related_name="priceprotection_phone",on_delete=models.CASCADE)
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name='pp_enterprise')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='pp_brand')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    receivable = models.FloatField(null=True)
        

     
    def calculate_receivable(self):
        # Calculate receivable based on price drop and number of sales
        sales_count = self.sales.count()
        self.receivable = self.price_drop * sales_count
        self.save()

class PPItems(models.Model):
    pp = models.ForeignKey(PriceProtection, related_name="pp_item",on_delete=models.CASCADE)
    # item = models.ForeignKey(Item, related_name="pp_item",on_delete=models.CASCADE)
    phone = models.ForeignKey(Phone,related_name="pp_item_phone", on_delete = models.CASCADE)
    imei_number = models.CharField(max_length=16)
    cashback = models.FloatField(blank=True,null=True)

    def save(self,*args, **kwargs):
        super().save(*args, **kwargs)  # Save again after processing the schemes and pp


    # def calculate_receivables(self,*args, **kwargs): 
    #     print("Calculating pp")
    #     pp = self.pp
    #     self.cashback = pp.price_drop
    #     print(f" = {self.cashback}")
    #     pp.receivable = (self.cashback + pp.receivable) if pp.receivable is not None else self.cashback
    #     pp.save()
    #     self.save()
        
        