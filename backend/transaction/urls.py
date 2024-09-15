from django.urls import path
from .views import PurchaseTransactionView,VendorView,SalesTransactionView,SchemeView,PriceProtectionView,StatsView,SchemeBrandView,SchemePhoneView

urlpatterns = [
    path('purchasetransaction/', PurchaseTransactionView.as_view(), name='transaction-create'),
    path('salestransaction/', SalesTransactionView.as_view(), name='transaction-create'),
    path('vendor/',VendorView.as_view(), name='vendor'),
    path('scheme/',SchemeView.as_view(), name='scheme'),
    path('scheme/brand/<int:id>/', SchemePhoneView.as_view(),name='schemephone'),
    path('scheme/<int:pk>/', SchemeView.as_view(), name='schemepatch'),
    path('priceprotection/',PriceProtectionView.as_view(),name='priceprotection'),
    path('stats/',StatsView.as_view(),name="stats"),
    path('schemebrands/',SchemeBrandView.as_view(), name='schemebrand')
]
