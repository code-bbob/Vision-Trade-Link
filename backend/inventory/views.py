from django.shortcuts import render
from .models import Brand, Phone, Item
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import BrandSerializer,PhoneSerializer
from rest_framework.decorators import api_view
from barcode import EAN13
from barcode.writer import SVGWriter
import io
from django.http import FileResponse


# Create your views here.

class BrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        id = request.GET.get("id")
        if id:
            brand = Brand.objects.get(id=id)
            phones = Phone.objects.filter(brand = brand)
            #print(phones)
            if phones:
                serializer = PhoneSerializer(phones,many=True)
                return Response(serializer.data)
            else:
                return Response("NONE")
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
            #print("YAHA SAMMAAA")
            serializer.save()
            return Response(serializer.data)
        

class PhoneIMEIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        user = request.user
        phone = Phone.objects.filter(id = id).first()
        #print(phone)
        items = Item.objects.filter(phone=phone)
        imei_list = []
        for item in items:
            imei_list.append(item.imei_number)
            
        return Response({"phone":phone.name,"list":imei_list})
    
@api_view(['GET'])
def generate_barcode(request):
    barcode = EAN13('123456789012', writer=SVGWriter())
    
    buffer = io.BytesIO()
    barcode.write(buffer)
    buffer.seek(0)

    print("BARCODE GENERATED")
    return FileResponse(buffer, content_type='image/svg+xml')