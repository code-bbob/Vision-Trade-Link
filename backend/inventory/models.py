from django.db import models
from enterprise.models import Enterprise
from django.core.validators import MinLengthValidator


# Create your models here.

class Brand(models.Model):
    name = models.CharField(max_length=20)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name="brand")
    
    def __str__(self):
        return self.name

class Phone(models.Model):
    name = models.CharField(max_length=30)
    quantity = models.IntegerField(null=True)
    unit_price = models.FloatField(null=True,blank=True)
    # total_price = models.FloatField(null=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)

    def __str__(self):
        return self.name    
    
    def save(self, *args, **kwargs):
        if self.pk is None:
            super().save(*args, **kwargs)
        
        # Now the instance is saved, we can safely filter related Items
        print("Calculating quantity......................")
        quantity = Item.objects.filter(phone=self).count()
        self.quantity = quantity

        # Call save again to update the quantity field
        super().save()


    def calculate_quantity(self):
        print("Calculating quantity......................")
        quantity = Item.objects.filter(phone=self).count()
        self.quantity = quantity
        self.save()

class Item(models.Model):
    imei_number = models.CharField(max_length=15,validators=[MinLengthValidator(15)],unique=True)
    phone = models.ForeignKey(Phone, related_name="item",on_delete=models.CASCADE)

    def __str__(self):
        return self.phone.name

