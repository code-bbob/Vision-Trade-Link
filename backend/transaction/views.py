from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PurchaseTransaction, Vendor, Purchase, Scheme,PriceProtection
from .serializers import PurchaseTransactionSerializer, VendorSerializer,SalesTransactionSerializer,SalesSerializer,Sales,SalesTransaction,SchemeSerializer,PurchaseSerializer,PurchaseTransactionSerializer, PriceProtectionSerializer
from rest_framework.permissions import IsAuthenticated

class PurchaseTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise
        transactions = PurchaseTransaction.objects.filter(enterprise=enterprise)
        serializer = PurchaseTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    def post(self, request, *args, **kwargs):
        data = request.data
        data["enterprise"]=request.user.person.enterprise.id
        serializer = PurchaseTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise
        purchases = Purchase.objects.filter(purchase_transaction__enterprise=enterprise)
        serializer = PurchaseSerializer(purchases, many=True)
        return Response(serializer.data)
    

class SalesTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise
        transactions = SalesTransaction.objects.filter(enterprise=enterprise)
        serializer = SalesTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    def post(self, request, *args, **kwargs):
        data = request.data
        data["enterprise"]=request.user.person.enterprise.id
        serializer = SalesTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SalesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise
        sales = Sales.objects.filter(sales_transaction__enterprise=enterprise)
        serializer = SalesSerializer(sales, many=True)
        return Response(serializer.data)

class VendorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise
        vendors = Vendor.objects.filter(enterprise=enterprise)
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        user = request.user
        enterprise = user.person.enterprise
        data = request.data
        data["enterprise"] = enterprise.id
        serializer = VendorSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SchemeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request,*args, **kwargs):
        schemes = Scheme.objects.filter(enterprise = request.user.person.enterprise)
        serializer = SchemeSerializer(schemes,many=True)
        return Response(serializer.data)
    
    def post(self,request,*args,**kwargs):
        data = request.data 
        data["enterprise"]= request.user.person.enterprise.id 
        print(data)
        serializer = SchemeSerializer(data=data)
        print("HERE")
        print(data)
        if serializer.is_valid(raise_exception=True):
            print("NOT HERE")
            serializer.save()
            print("XAINA")
            return Response(serializer.data)
        

class PriceProtectionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        pps = PriceProtection.objects.filter(enterprise = request.user.person.enterprise)
        serializer = PriceProtectionSerializer(pps,many=True)
        return Response(serializer.data)
    
    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id 
        serializer = PriceProtectionSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            serializer.save()
            return Response(serializer.data)