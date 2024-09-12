from django.urls import path
from .views import PurchaseTransactionView,VendorView,SalesTransactionView,SchemeView,PriceProtectionView,StatsView

urlpatterns = [
    path('purchasetransaction/', PurchaseTransactionView.as_view(), name='transaction-create'),
    path('salestransaction/', SalesTransactionView.as_view(), name='transaction-create'),
    path('vendor/',VendorView.as_view(), name='vendor'),
    path('scheme/',SchemeView.as_view(), name='scheme'),
    path('priceprotection/',PriceProtectionView.as_view(),name='priceprotection'),
    path('stats/',StatsView.as_view(),name="stats")
]
