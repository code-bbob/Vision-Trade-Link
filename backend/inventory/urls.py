from django.urls import path
from .views import BrandView,PhoneView, PhoneIMEIView

urlpatterns = [
    path('brand/',BrandView.as_view(), name='brand'),
    path('phone/',PhoneView.as_view(),name = 'phone'),
    path('phone/<str:id>/', PhoneIMEIView.as_view(), name='phoneimei')
]
