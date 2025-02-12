from django.urls import path
from .views import BrandView,PhoneView, PhoneIMEIView,generate_barcode

urlpatterns = [
    path('brand/',BrandView.as_view(), name='brand'),
    path('brand/<int:id>/',BrandView.as_view(), name='brand'),
    path('phone/',PhoneView.as_view(),name = 'phone'),
    path('deletephone/<int:id>/',PhoneView.as_view(),name = 'phone'),

    path('phone/<str:id>/', PhoneIMEIView.as_view(), name='phoneimei'),
    path('barcode/',generate_barcode,name = 'barcode'),
]
