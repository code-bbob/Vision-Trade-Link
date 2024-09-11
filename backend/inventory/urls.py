from django.urls import path
from .views import BrandView,PhoneView

urlpatterns = [
    path('brand/',BrandView.as_view(), name='brand'),
    path('phone/',PhoneView.as_view(),name = 'phone'),
]
