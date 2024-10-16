from rest_framework.serializers import ModelSerializer
from .models import Brand, Product

class BrandSerializer(ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'
    
class ProductSerializer(ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

