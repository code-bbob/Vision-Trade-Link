from django.urls import path
from .views import PurchaseTransactionView,VendorView,SalesTransactionView,SchemeView,PriceProtectionView,StatsView,SchemeBrandView,SchemePhoneView,SingleScheme,PPBrandView,PPPhoneView,SinglePP,VendorBrandsView,SingleVendorBrandView,PurchaseTransactionChangeView,SalesTransactionChangeView,SchemeChangeView,PriceProtectionChangeView,VendorTransactionView,BarChartView,LineGraphView,PurchaseReturnView,SalesReportView

urlpatterns = [
    path('purchasetransaction/', PurchaseTransactionView.as_view(), name='purchasetransaction-create'),
    path('purchasetransaction/branch/<int:branch>/', PurchaseTransactionView.as_view(), name='purchasetransaction-branch'),
    path('purchasetransaction/<int:pk>/', PurchaseTransactionChangeView.as_view(), name='purchasetransaction-create'),

    path('salestransaction/', SalesTransactionView.as_view(), name='salestransaction-create'),
    path('salestransaction/branch/<int:branch>/', SalesTransactionView.as_view(), name='salestransaction-branch'),
    path('salestransaction/<int:pk>/', SalesTransactionChangeView.as_view(), name='salestransaction-create'),

    path('vendor/',VendorView.as_view(), name='vendor'),
    path('vendor/branch/<int:branch>/',VendorView.as_view(), name='vendorbranch'),
    
    path('vendortransaction/',VendorTransactionView.as_view(), name='vendortransaction'),
    path('vendortransaction/branch/<int:branch>/',VendorTransactionView.as_view(), name='vendortransaction'),

    path('vendortransaction/<int:pk>/',VendorTransactionView.as_view(), name='vendortransaction'),

     
    path('scheme/',SchemeView.as_view(), name='scheme'),
    path('scheme/branch/<int:branch>/', SchemeView.as_view(), name='schemebranch'),
    path('scheme/<int:pk>/', SchemeChangeView.as_view(), name='schemechange'),

    path('scheme/brand/<int:id>/', SchemePhoneView.as_view(),name='schemephone'),


    path('priceprotection/',PriceProtectionView.as_view(),name='priceprotection'),
    path('priceprotection/branch/<int:branch>/', PriceProtectionView.as_view(), name='priceprotectionbranch'),
    path('priceprotection/<int:pk>/', PriceProtectionChangeView.as_view(), name='schemepatch'),
    
    path('stats/',StatsView.as_view(),name="stats"),
    path('schemebrands/branch/<int:branch>/',SchemeBrandView.as_view(), name='schemebrand'),
    path('singlescheme/<int:id>/',SingleScheme.as_view(),name='singlescheme'),


    path('ppbrands/',PPBrandView.as_view(), name='ppbrand'),
    path('ppbrands/branch/<int:branch>/', PPBrandView.as_view(), name='ppbrandbranch'),
    path('singlepp/<int:id>/',SinglePP.as_view(),name='singlepp'),
    path('pp/brand/<int:id>/', PPPhoneView.as_view(),name='ppphone'),
    path('pp/<int:pk>/', PriceProtectionView.as_view(), name='pppatch'),

    path('vendorbrand/branch/<int:branch>/',VendorBrandsView.as_view(), name='vendorbrand'),
    path('vendorbrand/<int:id>/',SingleVendorBrandView.as_view(), name = 'singlevendorbrand'),

    path('barchart/',BarChartView.as_view(),name='barchart'),
    path('linegraph/',LineGraphView.as_view(),name='linegraph'),

    path('purchase-return/',PurchaseReturnView.as_view(),name='purchase_return'),
    path('purchase-return/branch/<int:branch>/',PurchaseReturnView.as_view(),name='purchase_return_branch'),

    path('purchase-return/<int:pk>/',PurchaseReturnView.as_view(),name='purchase_return'),

    path('sales-report/',SalesReportView.as_view(),name='sales_report'),
    path('sales-report/branch/<int:branch>/', SalesReportView.as_view(), name='sales_report_branch'),



]
