from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PurchaseTransaction, Vendor, Purchase, Scheme,PriceProtection
from .serializers import PurchaseTransactionSerializer, VendorSerializer,SalesTransactionSerializer,SalesSerializer,Sales,SalesTransaction,SchemeSerializer,PurchaseSerializer,PurchaseTransactionSerializer, PriceProtectionSerializer, VendorBrandSerializer
from inventory.serializers import BrandSerializer
from rest_framework.permissions import IsAuthenticated
from inventory.models import Item,Brand,Phone
from datetime import date, datetime
from django.utils.dateparse import parse_date
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db import models
from rest_framework import generics




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


class PurchaseTransactionChangeView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PurchaseTransaction.objects.all()
    serializer_class = PurchaseTransactionSerializer


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
        user = request.user
        enterprise = user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        transactions = SalesTransaction.objects.filter(enterprise=enterprise)

        if search:
            phone_transactions = transactions.filter(sales__phone__name__icontains = search)
            customer_trasactions = transactions.filter(name__icontains = search)
            transactions = phone_transactions.union(customer_trasactions)
        
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

        serializer = SalesTransactionSerializer(paginated_transactions, many=True)
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
        id = data["phone"]
        brand = Phone.objects.get(id=id).brand
        data["brand"] = brand.id
        print("HERE IS DATA",data)
        serializer = SchemeSerializer(data=data)
        print("HERE")
        print(data)
        if serializer.is_valid(raise_exception=True):
            print("NOT HERE")
            serializer.save()
            print("XAINA")
            return Response(serializer.data)
    
    def patch(self,request,pk):
        
        scheme = get_object_or_404(Scheme, pk=pk)
        
        # Pass `partial=True` to allow partial updates
        serializer = SchemeSerializer(scheme, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()  # Save the changes
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SchemePhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        user = request.user
        enterprise = user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        schemes = Scheme.objects.filter(enterprise=enterprise,brand=id)

        if search:
            schemes_phone = schemes.filter(phone__name__icontains = search)
            schemes_imei = schemes.filter(sales__phone__item__imei_number__icontains = search)
            schemes = schemes_phone.union(schemes_imei)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            schemes = Scheme.objects.filter(
                from_date__range=(start_date, end_date)
            )
        
        schemes = schemes.order_by('-from_date')


        # paginator = PageNumberPagination()
        # paginator.page_size = 2  # Set the page size here
        # paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = SchemeSerializer(schemes, many=True)
        # return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data)


        

class PriceProtectionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        pps = PriceProtection.objects.filter(enterprise = request.user.person.enterprise)
        serializer = PriceProtectionSerializer(pps,many=True)
        return Response(serializer.data)
    
    
    def patch(self,request,pk):
        
        pps = get_object_or_404(PriceProtection, pk=pk)
        print(pps)
        
        # Pass `partial=True` to allow partial updates
        serializer = PriceProtectionSerializer(pps, data=request.data, partial=True)

        
        if serializer.is_valid():
            serializer.save()  # Save the changes
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
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
    
class SchemeBrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise

        # Get all brands with schemes under the user's enterprise
        brands_with_schemes = Brand.objects.filter(enterprise=enterprise, scheme_brand__isnull=False).distinct()

        active_result = []
        expired_result = []

        # Loop through each brand
        for brand in brands_with_schemes:
            # Filter active schemes
            active_schemes = Scheme.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status = "active"  # Schemes with to_date in the future
            )
            # Filter expired schemes
            expired_schemes = Scheme.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status="expired"  # Schemes with to_date in the past
            )

            # Calculate total receivables for active schemes
            active_count = active_schemes.count()
            active_receivables = active_schemes.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Calculate total receivables for expired schemes
            expired_count = expired_schemes.count()
            expired_receivables = expired_schemes.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Add to active list if there are active schemes
            if active_count > 0:
                active_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": active_count,
                    "total_receivables": active_receivables
                })

            # Add to expired list if there are expired schemes
            if expired_count > 0:
                expired_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": expired_count,
                    "total_receivables": expired_receivables
                })

        # Return both active and expired lists
        return Response({
            "active_schemes": active_result,
            "expired_schemes": expired_result
        })
    
class SingleScheme(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        scheme = Scheme.objects.filter(id=id).first()
        sales = scheme.sales.all().order_by('-sales_transaction__date')
        list = []
        if sales:
            for sale in sales:
                list.append(sale.imei_number)
        dict = {
            "phone":scheme.phone.name,
            "list":list,
            "receivables":scheme.receivable,
            "status":scheme.status
        }
        return Response(dict)
    

class PPBrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.person.enterprise

        # Get all brands with schemes under the user's enterprise
        brands_with_pp = Brand.objects.filter(enterprise=enterprise, pp_brand__isnull=False).distinct()

        active_result = []
        expired_result = []

        # Loop through each brand
        for brand in brands_with_pp:
            # Filter active schemes
            active_pps = PriceProtection.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status = "active"  # Schemes with to_date in the future
            )
            # Filter expired schemes
            expired_pps = PriceProtection.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status="expired"  # Schemes with to_date in the past
            )

            # Calculate total receivables for active schemes
            active_count = active_pps.count()
            active_receivables = active_pps.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Calculate total receivables for expired schemes
            expired_count = expired_pps.count()
            expired_receivables = expired_pps.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Add to active list if there are active schemes
            if active_count > 0:
                active_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": active_count,
                    "total_receivables": active_receivables
                })

            # Add to expired list if there are expired schemes
            if expired_count > 0:
                expired_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": expired_count,
                    "total_receivables": expired_receivables
                })

        # Return both active and expired lists
        return Response({
            "active_pps": active_result,
            "expired_pps": expired_result
        })
    
class SinglePP(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        pp = PriceProtection.objects.filter(id=id).first()
        sales = pp.sales.all().order_by('-sales_transaction__date')
        list = []
        if sales:
            for sale in sales:
                list.append(sale.imei_number)
        dict = {
            "phone":pp.phone.name,
            "list":list,
            "receivables":pp.receivable,
            "status":pp.status
        }
        return Response(dict)
    


class PPPhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        user = request.user
        enterprise = user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        pps = PriceProtection.objects.filter(enterprise=enterprise,brand=id)

        if search:
            pps_phone = pps.filter(phone__name__icontains = search)
            pps_imei = pps.filter(sales__phone__item__imei_number__icontains = search)
            pps = pps_phone.union(pps_imei)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            pps = PriceProtection.objects.filter(
                from_date__range=(start_date, end_date)
            )
        
        pps = pps.order_by('-from_date')


        # paginator = PageNumberPagination()
        # paginator.page_size = 2  # Set the page size here
        # paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = PriceProtectionSerializer(pps, many=True)
        # return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data)


class VendorBrandsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # id = request.GET.get("id")
        # if id:
        #     brand = Brand.objects.get(id=id)
        #     phones = Phone.objects.filter(brand = brand)
        #     print(phones)
        #     if phones:
        #         serializer = PhoneSerializer(phones,many=True)
        #         return Response(serializer.data)
        #     else:
        #         return Response("NONE")
        brands = Brand.objects.filter(enterprise = request.user.person.enterprise)
        serializer = VendorBrandSerializer(brands,many=True)


        return Response(serializer.data)

class SingleVendorBrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        vendors = Vendor.objects.filter(enterprise = request.user.person.enterprise, brand=id)
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data)