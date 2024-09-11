from django.shortcuts import render
from .models import Brand, Phone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import BrandSerializer,PhoneSerializer


# Create your views here.

class BrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        brands = Brand.objects.filter(enterprise = request.user.person.enterprise)
        serializer = BrandSerializer(brands,many=True)
        return Response(serializer.data)

    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        serializer = BrandSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            serializer.save()
            return Response(serializer.data)
        
class PhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        phones = Phone.objects.filter(brand__enterprise = request.user.person.enterprise)
        serializer = PhoneSerializer(phones,many=True)
        return Response(serializer.data)

    def post(self,request,*args, **kwargs):
        data = request.data
        # data["enterprise"] = request.user.person.enterprise.id
        serializer = PhoneSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            serializer.save()
            return Response(serializer.data)
