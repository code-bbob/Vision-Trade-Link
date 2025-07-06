from django.contrib import admin
from .models import PurchaseTransaction, Purchase, Vendor, SalesTransaction, Sales,VendorTransactions,Staff, Debtor,DebtorTransaction, PurchaseReturn, SalesReturn
# Register your models here.

admin.site.register(PurchaseTransaction)
admin.site.register(Purchase)
admin.site.register(Vendor)
admin.site.register(SalesTransaction)
admin.site.register(Sales)
admin.site.register(VendorTransactions)
admin.site.register(Staff)
admin.site.register(Debtor)
admin.site.register(DebtorTransaction)
admin.site.register(PurchaseReturn)
admin.site.register(SalesReturn)