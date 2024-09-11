from django.db import models
from enterprise.models import Enterprise

# Create your models here.

class Brand(models.Model):
    name = models.CharField(max_length=20)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name="brand")
    
    def __str__(self):
        return self.name

class Phone(models.Model):
    name = models.CharField(max_length=30)
    quantity = models.IntegerField(null=True)
    unit_price = models.FloatField(null=True)
    total_price = models.FloatField(null=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)

    def __str__(self):
        return self.name    

class Item(models.Model):
    imei_number = models.CharField(max_length=20)
    phone = models.ForeignKey(Phone, related_name="item",on_delete=models.CASCADE)