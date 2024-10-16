from django.urls import path
from . import views

urlpatterns = [
    path('purchase/', views.PurchaseTransactionView.as_view(), name='purchase'),
    path('purchase/<int:pk>/', views.PurchaseTransactionView.as_view(), name='purchase'),
    path('vendor/', views.VendorView.as_view(), name='vendor'),
    path('sales/', views.SalesTransactionView.as_view(), name='sales'),
    path('sales/<int:pk>/', views.SalesTransactionView.as_view(), name='sales'),
    path('vendortransactions/', views.VendorTransactionView.as_view(), name='vendortransactions'),
    path('vendortransactions/<int:pk>/', views.VendorTransactionView.as_view(), name='vendortransactions'),
]