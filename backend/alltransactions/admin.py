from django.contrib import admin
from .models import PurchaseTransaction, Purchase, Vendor
# Register your models here.

admin.site.register(PurchaseTransaction)
admin.site.register(Purchase)
admin.site.register(Vendor)