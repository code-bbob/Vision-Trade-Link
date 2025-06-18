from rest_framework.serializers import ModelSerializer, SerializerMethodField
from .models import Brand, Product

class BrandSerializer(ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'
    
class ProductSerializer(ModelSerializer):
    brandName = SerializerMethodField()
    class Meta:
        model = Product
        fields = '__all__'
    def get_brandName(self,obj):
        return obj.brand.name


