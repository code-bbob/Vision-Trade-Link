from django.db import models
import random

# Create your models here.

class Brand(models.Model):
    name = models.CharField(max_length=20)
    stock = models.FloatField(null=True,blank=True)
    count = models.IntegerField(null=True,blank=True)
    enterprise = models.ForeignKey('enterprise.Enterprise', on_delete=models.CASCADE,related_name='all_brand')
    
    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=30)
    uid = models.CharField(max_length = 12,blank=True,unique=True) 
    # quantity = models.IntegerField(null=True,blank=True)
    unit_price = models.FloatField(null=True,blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    stock = models.IntegerField(null=True,blank=True)
    count = models.IntegerField(null=True,blank=True)
    enterprise = models.ForeignKey('enterprise.Enterprise', on_delete=models.CASCADE,related_name='all_product')
    def __str__(self):
        return self.name    
    
    def save(self,*args, **kwargs):

        if self.pk is None:
            self.uid = self.generate_unique_uid()
        super().save(*args, **kwargs)
    

    def generate_unique_uid(self):
            print("Generating uid")
            while True:
                uid = ''.join([str(random.randint(0, 9)) for _ in range(12)])
                if uid.startswith('0') or uid.startswith('1'):
                    continue
                if not Product.objects.filter(uid=uid).exists():
                    return uid
