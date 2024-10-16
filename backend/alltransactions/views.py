from django.shortcuts import render
from rest_framework.response import Response
from .serializers import PurchaseTransactionSerializer,SalesTransactionSerializer,VendorSerializer,VendorTransactionSerialzier
from rest_framework.views import APIView
from rest_framework import status
from .models import PurchaseTransaction,SalesTransaction,Vendor,VendorTransactions
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class PurchaseTransactionView(APIView):
    
    def post(self, request, format=None):
        user = request.user
        enterprise = user.person.enterprise
        request.data['enterprise'] = enterprise.id
        serializer = PurchaseTransactionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, format=None):
        purchase_transaction = PurchaseTransaction.objects.filter(enterprise=request.user.person.enterprise)
        serializer = PurchaseTransactionSerializer(purchase_transaction, many=True)
        return Response(serializer.data)
    
    def patch(self,request,pk,format=None):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        print(data)
        
        try:
            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
        except PurchaseTransaction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = PurchaseTransactionSerializer(purchase_transaction,data=data,partial=True)
        print("asdmnb",serializer)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk,format=None):
        purchase_transaction = PurchaseTransaction.objects.get(id=pk)
        purchase_transaction.delete()
        return Response("Deleted")

class SalesTransactionView(APIView):
        
        def post(self, request, format=None):
            user = request.user
            enterprise = user.person.enterprise
            request.data['enterprise'] = enterprise.id
            serializer = SalesTransactionSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        def get(self, request, format=None):
            sales_transaction = SalesTransaction.objects.filter(enterprise=request.user.person.enterprise)
            serializer = SalesTransactionSerializer(sales_transaction, many=True)
            return Response(serializer.data)
        

class VendorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        id = request.GET.get("id")
        if id:
            vendor = Vendor.objects.get(id=id)
            
        vendors = Vendor.objects.filter(enterprise = request.user.person.enterprise)
        serializer = VendorSerializer(vendors,many=True)
        return Response(serializer.data)
    

class VendorTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,pk=None):
        if pk:
            vendor_transactions = VendorTransactions.objects.get(id=pk)
            serializer = VendorTransactionSerialzier(vendor_transactions)
            return Response(serializer.data)
        query = request.GET.get('search')
        vendor_transactions = VendorTransactions.objects.filter(enterprise = request.user.person.enterprise)
        if query:
            vendor_transactions_name = VendorTransactions.objects.filter(vendor__name__icontains=query,enterprise = request.user.person.enterprise)
            vendor_transactions_brand = VendorTransactions.objects.filter(vendor__brand__name__icontains=query,enterprise = request.user.person.enterprise)
            vendor_transactions = vendor_transactions_name.union(vendor_transactions_brand)
        serializer = VendorTransactionSerialzier(vendor_transactions,many=True)
        return Response(serializer.data)
    
    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        serializer = VendorTransactionSerialzier(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self,request,pk):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        vendor_transaction = VendorTransactions.objects.get(id=pk)
        serializer = VendorTransactionSerialzier(vendor_transaction,data=data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk):
        vendor_transaction = VendorTransactions.objects.get(id=pk)
        amount = vendor_transaction.amount
        vendor = vendor_transaction.vendor
        vendor_transaction.delete()
        vendor.due += amount
        vendor.save()
        return Response("Deleted")