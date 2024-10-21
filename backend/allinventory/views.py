from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Product,Brand
from .serializers import ProductSerializer,BrandSerializer
from rest_framework.decorators import api_view
from barcode import EAN13
from barcode.writer import SVGWriter
import io
from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class ProductView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None):
        if pk:
            try:
                product = Product.objects.get(pk=pk)
                serializer = ProductSerializer(product)
                return Response(serializer.data)
            except Product.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        search = request.GET.get('search')
        if search:
            products = Product.objects.filter(enterprise=request.user.person.enterprise,name__icontains=search)
            serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)
        
        products = Product.objects.filter(enterprise=request.user.person.enterprise)
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    def post(self, request, format=None):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def patch(self,request,pk,format=None):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        
        try:
            product = Product.objects.get(id=pk)
        except Product.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product,data=data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk,format=None):
        product = Product.objects.get(id=pk)
        product.delete()
        return Response("Deleted")
    
class BrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request,pk=None, format=None):
        if pk:
            brand = Brand.objects.get(id=pk)
            products = Product.objects.filter(brand = brand)
            #print(phones)
            if products:
                serializer = ProductSerializer(products,many=True)
                return Response(serializer.data)
            else:
                return Response("NONE")
        search = request.GET.get('search')
        if search:
            brands = Brand.objects.filter(enterprise=request.user.person.enterprise,name__icontains=search)
            serializer = BrandSerializer(brands, many=True)
            return Response(serializer.data)
        brands = Brand.objects.filter(enterprise=request.user.person.enterprise)
        serializer = BrandSerializer(brands, many=True)
        return Response(serializer.data)
    
    def post(self, request, format=None):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        serializer = BrandSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def patch(self,request,pk,format=None):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        
        try:
            brand = Brand.objects.get(id=pk)
        except Brand.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = BrandSerializer(brand,data=data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk,format=None):
        try:
            brand = Brand.objects.get(id=pk)
            brand.delete()
            return Response("Deleted")
        except Brand.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        


@api_view(['GET'])
def generate_barcode(request,pk=None):
    if pk:
        uid = Product.objects.get(id=pk).uid
        print(uid)

    barcode = EAN13(uid, writer=SVGWriter())
    
    buffer = io.BytesIO()
    barcode.write(buffer)
    buffer.seek(0)

    print("BARCODE GENERATED")
    return FileResponse(buffer, content_type='image/svg+xml')