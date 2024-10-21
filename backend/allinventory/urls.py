from django.urls import path
from . import views

urlpatterns = [
    path('product/', views.ProductView.as_view()),
    path('product/<int:pk>/', views.ProductView.as_view()),
    path('brand/', views.BrandView.as_view()),
    path('brand/<int:pk>/', views.BrandView.as_view()),
    path('barcode/<int:pk>/', views.generate_barcode),
    
]
