from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PurchaseTransaction, Vendor, Purchase, Scheme,PriceProtection
from .serializers import PurchaseTransactionSerializer, VendorSerializer,SalesTransactionSerializer,SalesSerializer,Sales,SalesTransaction,SchemeSerializer,PurchaseSerializer,PurchaseTransactionSerializer, PriceProtectionSerializer
from rest_framework.permissions import IsAuthenticated
from inventory.models import Item,Brand
from datetime import date, datetime
from django.utils.dateparse import parse_date
from rest_framework.pagination import PageNumberPagination




class PurchaseTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if search:
            print(search)
        else:
            print("NO QUERY")
        transactions = PurchaseTransaction.objects.filter(enterprise=enterprise)
        
        if search:
            phone_transactions = transactions.filter(purchase__phone__name__icontains = search)
            vendor_trasactions = transactions.filter(vendor__name__icontains = search)
            transactions = phone_transactions.union(vendor_trasactions)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            transactions = PurchaseTransaction.objects.filter(
                date__range=(start_date, end_date)
            )

        transactions = transactions.order_by('-date')


        paginator = PageNumberPagination()
        paginator.page_size = 2  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = PurchaseTransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
        
    def post(self, request, *args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        
        # Only process the date if it's provided, otherwise, it will take the default value from the model.
        if "date" in data:
            date_str = data["date"]
            # Assuming the format is 'YYYY-MM-DD'
            date_object = datetime.strptime(date_str, '%Y-%m-%d').date()
            datetime_with_current_time = datetime.combine(date_object, datetime.now().time())
            data["date"] = datetime_with_current_time.isoformat()
        
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
        

class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if not start_date or not end_date:
            today = date.today()
            start_date = today.replace(day=1)  # First day of the current month
            end_date = today
        
        start_date = parse_date(start_date) if isinstance(start_date, str) else start_date
        end_date = parse_date(end_date) if isinstance(end_date, str) else end_date

        enterprise = request.user.person.enterprise
    
        allpurchases = Purchase.objects.filter(purchase_transaction__enterprise = enterprise).count()
        allsales = Sales.objects.filter(sales_transaction__enterprise = enterprise).count()
        allstock = Item.objects.filter(phone__brand__enterprise = enterprise).count()
        allbrands = Brand.objects.filter(enterprise = enterprise).count()
        monthlypurchases = Purchase.objects.filter(purchase_transaction__enterprise = enterprise,purchase_transaction__date__range=(start_date, end_date)).count()
        monthlysales = Sales.objects.filter(sales_transaction__enterprise = enterprise,sales_transaction__date__range=(start_date, end_date)).count()

        ptamt = 0
        allptamt = 0
        pts = PurchaseTransaction.objects.filter(enterprise = enterprise)
        if pts:
            for pt in pts:
                # print(pt.total_amount)
                allptamt += pt.total_amount

        pts = pts.filter(date__range=(start_date, end_date))
        if pts:
            for pt in pts:
                # print(pt.total_amount)
                ptamt += pt.total_amount
        stamt = 0
        allstamt = 0
        sts = SalesTransaction.objects.filter(enterprise=enterprise)
        if sts:
            for st in sts:
                # print(st.total_amount)
                allstamt += st.total_amount

        sts = sts.filter(date__range=(start_date, end_date))
        if sts:
            for st in sts:
                print(st.total_amount)
                stamt += st.total_amount    
        stat = { 
            "enterprise" : enterprise.name,
            "alltime":{
                "purchases" : allpurchases,
                "allptamt":allptamt,
                "sales": allsales,
                "allstamt":allstamt,
                "profit": "Later"
            },
            "monthly":{
                "purchases" : monthlypurchases,
                "ptamt":ptamt,
                "stamt":stamt,
                "sales": monthlysales,
                "profit": "Later",
            },
            "stock": allstock,
            "brands" : allbrands
        }
        return Response(stat)