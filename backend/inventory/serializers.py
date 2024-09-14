from rest_framework import serializers
from . models import Brand,Phone,Item

class BrandSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField(read_only = True)
    class Meta:
        model = Brand
        fields = '__all__'

    def get_items(self,obj):
        items = Item.objects.filter(phone__brand = obj).count()
        return items
    

class PhoneSerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField(read_only = True)

    class Meta:
        model = Phone 
        fields = "__all__"

    
    def get_brand_name(self,obj):
        return obj.brand.name