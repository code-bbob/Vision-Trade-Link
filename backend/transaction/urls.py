from django.urls import path
from .views import PurchaseTransactionView,VendorView,SalesTransactionView,SchemeView,PriceProtectionView,StatsView,SchemeBrandView,SchemePhoneView,SingleScheme,PPBrandView,PPPhoneView,SinglePP,VendorBrandsView,SingleVendorBrandView,PurchaseTransactionChangeView,SalesTransactionChangeView,SchemeChangeView,PriceProtectionChangeView,VendorTransactionView,BarChartView

urlpatterns = [
    path('purchasetransaction/', PurchaseTransactionView.as_view(), name='purchasetransaction-create'),
    path('purchasetransaction/<int:pk>/', PurchaseTransactionChangeView.as_view(), name='purchasetransaction-create'),

    path('salestransaction/', SalesTransactionView.as_view(), name='salestransaction-create'),
    path('salestransaction/<int:pk>/', SalesTransactionChangeView.as_view(), name='salestransaction-create'),

    path('vendor/',VendorView.as_view(), name='vendor'),
    path('vendortransaction/',VendorTransactionView.as_view(), name='vendortransaction'),
    path('vendortransaction/<int:pk>/',VendorTransactionView.as_view(), name='vendortransaction'),

     
    path('scheme/',SchemeView.as_view(), name='scheme'),
    path('scheme/<int:pk>/', SchemeChangeView.as_view(), name='cchemechange'),
    path('scheme/brand/<int:id>/', SchemePhoneView.as_view(),name='schemephone'),
    path('scheme/<int:pk>/', SchemeView.as_view(), name='schemepatch'),
    path('priceprotection/',PriceProtectionView.as_view(),name='priceprotection'),
    path('priceprotection/<int:pk>/', PriceProtectionChangeView.as_view(), name='schemepatch'),
    
    path('stats/',StatsView.as_view(),name="stats"),
    path('schemebrands/',SchemeBrandView.as_view(), name='schemebrand'),
    path('singlescheme/<int:id>/',SingleScheme.as_view(),name='singlescheme'),
    path('ppbrands/',PPBrandView.as_view(), name='ppbrand'),
    path('singlepp/<int:id>/',SinglePP.as_view(),name='singlepp'),
    path('pp/brand/<int:id>/', PPPhoneView.as_view(),name='ppphone'),
    path('pp/<int:pk>/', PriceProtectionView.as_view(), name='pppatch'),
    
    path('vendorbrand/',VendorBrandsView.as_view(), name='vendorbrand'),
    path('vendorbrand/<int:id>/',SingleVendorBrandView.as_view(), name = 'singlevendorbrand'),

    path('barchart/',BarChartView.as_view(),name='barchart')

    


]
