from django.shortcuts import render
from rest_framework.response import Response
from .serializers import PurchaseTransactionSerializer,PurchaseReturnSerializer,SalesTransactionSerializer,VendorSerializer,VendorTransactionSerialzier,VendorBrandSerializer
from rest_framework.views import APIView
from rest_framework import status
from .models import PurchaseTransaction,SalesTransaction,Vendor,VendorTransactions,Purchase,Sales,PurchaseReturn
from rest_framework.permissions import IsAuthenticated
from allinventory.models import Product,Brand
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import date, datetime,time
from django.utils.dateparse import parse_date
from rest_framework.pagination import PageNumberPagination
from django.utils.timezone import make_aware,localtime
from django.db.models import Max


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
    
    def get(self, request,pk=None, format=None):
        user = request.user
        enterprise = user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        transactions = PurchaseTransaction.objects.filter(enterprise=enterprise)

        if pk:
            #print(pk)
            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
            serializer = PurchaseTransactionSerializer(purchase_transaction)
            return Response(serializer.data)
        
        if search:
            phone_transactions = transactions.filter(purchase__product__name__icontains = search)
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

        transactions = transactions.order_by('-id')


        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = PurchaseTransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def patch(self,request,pk,format=None):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        try:
            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
        except PurchaseTransaction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = PurchaseTransactionSerializer(purchase_transaction,data=data,partial=True)
        #print("asdmnb",serializer)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk,format=None):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        purchase_transaction = PurchaseTransaction.objects.get(id=pk)
        purchases = purchase_transaction.purchase.all()
        for purchase in purchases:
            product = purchase.product
            product.count -= purchase.quantity
            product.stock -= purchase.total_price
            product.save()
            brand = product.brand
            brand.count -= purchase.quantity
            brand.stock -= purchase.total_price
            #print(brand.stock)
            brand.save()
        amount = purchase_transaction.total_amount
        vendor = purchase_transaction.vendor
        brand = vendor.brand
        vendor.due -= amount
        vendor.save()
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
        
        def get(self, request,pk=None, format=None):
            user = request.user
            enterprise = user.person.enterprise
            search = request.GET.get('search')
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            transactions = SalesTransaction.objects.filter(enterprise=enterprise)

            if pk:
                sales_transaction = SalesTransaction.objects.get(id=pk)
                serializer = SalesTransactionSerializer(sales_transaction)
                return Response(serializer.data)
            
            if search:
                product_transactions = transactions.filter(sales__product__name__icontains = search)
                customer_transactions = transactions.filter(name__icontains = search)
                phone_transactions = transactions.filter(phone_number__icontains = search)
                transactions = product_transactions.union(customer_transactions,phone_transactions)
            
            if start_date and end_date:
                start_date = parse_date(start_date)
                end_date = parse_date(end_date)

            if start_date and end_date:
                start_date = datetime.combine(start_date, datetime.min.time())
                end_date = datetime.combine(end_date, datetime.max.time())
                
                transactions = SalesTransaction.objects.filter(
                    date__range=(start_date, end_date)
                )

            transactions = transactions.order_by('-id')


            paginator = PageNumberPagination()
            paginator.page_size = 5  # Set the page size here
            paginated_transactions = paginator.paginate_queryset(transactions, request)

            serializer = SalesTransactionSerializer(paginated_transactions, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        def patch(self,request,pk,format=None):
            data = request.data
            data['enterprise'] = request.user.person.enterprise.id
            role = request.user.person.role
            if role != "Admin":
                return Response("Unauthorized")

            try:
                sales_transaction = SalesTransaction.objects.get(id=pk)
            except SalesTransaction.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)

            serializer = SalesTransactionSerializer(sales_transaction,data=data,partial=True)
            #print("asdmnb",serializer)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors)
        
        def delete(self,request,pk,format=None):
            sales_transaction = SalesTransaction.objects.get(id=pk)
            role = request.user.person.role
            #print(role)
            if role != "Admin":
                #print("HERERERERE")
                return Response("Unauthorized")
            sales = sales_transaction.sales.all()
            for sale in sales:
                product = sale.product
                product.count += sale.quantity
                product.stock += sale.total_price
                product.save()
                brand = product.brand
                brand.count += sale.quantity
                brand.stock += sale.total_price
                brand.save()
            sales_transaction.delete()
            return Response("Deleted")
        
class VendorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        id = request.GET.get("id")
        if id:
            vendor = Vendor.objects.get(id=id)
            
        vendors = Vendor.objects.filter(enterprise = request.user.person.enterprise)
        serializer = VendorSerializer(vendors,many=True)
        return Response(serializer.data)
    
    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        serializer = VendorSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            serializer.save()
            return Response(serializer.data)
    

class VendorTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,pk=None):
        if pk:
            vendor_transactions = VendorTransactions.objects.get(id=pk)
            serializer = VendorTransactionSerialzier(vendor_transactions)
            return Response(serializer.data)
        query = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        vendor_transactions = VendorTransactions.objects.filter(enterprise = request.user.person.enterprise)
        if query:
            vendor_transactions_name = VendorTransactions.objects.filter(vendor__name__icontains=query,enterprise = request.user.person.enterprise)
            vendor_transactions_brand = VendorTransactions.objects.filter(vendor__brand__name__icontains=query,enterprise = request.user.person.enterprise)
            vendor_transactions = vendor_transactions_name.union(vendor_transactions_brand)

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            vendor_transactions = VendorTransactions.objects.filter(
                date__range=(start_date, end_date)
            )

        vendor_transactions = vendor_transactions.order_by('-id')

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(vendor_transactions, request)

        serializer = VendorTransactionSerialzier(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
    
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
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        vendor_transaction = VendorTransactions.objects.get(id=pk)
        serializer = VendorTransactionSerialzier(vendor_transaction,data=data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        vendor_transaction = VendorTransactions.objects.get(id=pk)
        amount = vendor_transaction.amount
        vendor = vendor_transaction.vendor
        vendor_transaction.delete()
        vendor.due += amount
        vendor.save()
        return Response("Deleted")
    

class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if not start_date or not end_date:
            today = timezone.now()
            start_date = today.replace(day=1)  # First day of the current month
            end_date = today
        
        start_date = parse_date(start_date) if isinstance(start_date, str) else start_date
        end_date = parse_date(end_date) if isinstance(end_date, str) else end_date

        #print(start_date,end_date)

        enterprise = request.user.person.enterprise
        #print("HERE")
    
        allstock = Product.objects.filter(brand__enterprise = enterprise).count()
        allbrands = Brand.objects.filter(enterprise = enterprise).count()

        monthlypurchases = Purchase.objects.filter(purchase_transaction__enterprise = enterprise,purchase_transaction__date__range=(start_date, end_date))
        #print(monthlypurchases)
        monthlysales = Sales.objects.filter(sales_transaction__enterprise = enterprise,sales_transaction__date__range=(start_date, end_date))

        dailypurchases = Purchase.objects.filter(purchase_transaction__enterprise = enterprise,purchase_transaction__date = today.date())
        dailysales = Sales.objects.filter(sales_transaction__enterprise = enterprise,sales_transaction__date = today.date())




        ptamt = 0
        dailyptamt = 0

        pts = PurchaseTransaction.objects.filter(enterprise = enterprise,date__range=(start_date, end_date))
        if pts:
            for pt in pts:
                # #print(pt.total_amount)
                ptamt = (pt.total_amount+ptamt) if pt.total_amount else ptamt

        pts = PurchaseTransaction.objects.filter(enterprise = enterprise,date = today.date())
        if pts:
            for pt in pts:
                # #print(pt.total_amount)
                dailyptamt += pt.total_amount if pt.total_amount else dailyptamt

        stamt = 0
        dailystamt = 0
       

        sts = SalesTransaction.objects.filter(enterprise = enterprise,date__range=(start_date, end_date))
        if sts:
            for st in sts:
                stamt = (st.total_amount + stamt) if st.total_amount else stamt
        
        sts = SalesTransaction.objects.filter(enterprise=enterprise,date = today.date())
        if sts:
            for st in sts:
                dailystamt = (st.total_amount + dailystamt) if st.total_amount else dailystamt

        daily_profit = 0
        for sale in dailysales:
            product = sale.product
            daily_profit += sale.unit_price - product.unit_price
        #     purchase = Purchase.objects.filter(imei_number = sale.imei_number).first()
        #     if purchase:
        #         daily_profit += sale.unit_price - purchase.unit_price

        daily_profit = dailystamt-dailyptamt
        
        monthly_profit = 0
        
        # for sale in monthlysales:
        #     purchase = Purchase.objects.filter(imei_number = sale.imei_number).first()
        #     if purchase:
        #         monthly_profit += sale.unit_price - purchase.unit_price

        monthly_profit = stamt - ptamt
        
        stat = { 
            "enterprise" : enterprise.name,
            "daily":{
                "purchases" : dailypurchases.count(),
                "dailyptamt":dailyptamt,
                "sales": dailysales.count(),
                "dailystamt":dailystamt,
                "profit": round(daily_profit,2)
            },
            "monthly":{
                "purchases" : monthlypurchases.count(),
                "ptamt":ptamt,
                "stamt":stamt,
                "sales": monthlysales.count(),
                "profit": round(monthly_profit,2)
            },
            "stock": allstock,
            "brands" : allbrands
        }
        return Response(stat)
    
class VendorBrandsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        brands = Brand.objects.filter(enterprise = request.user.person.enterprise)
        serializer = VendorBrandSerializer(brands,many=True)


        return Response(serializer.data)
    
class SingleVendorBrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,pk):
        vendors = Vendor.objects.filter(enterprise = request.user.person.enterprise, brand=pk)
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data)


class PurchaseReturnView(APIView):

    permission_classes = [IsAuthenticated]


    def get(self, request):
        enterprise = request.user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        # Base QuerySet
        purchase_returns = PurchaseReturn.objects.filter(enterprise=enterprise)

        # -----------------
        # 1) Search Filter
        # -----------------
        if search:
            name_filter = purchase_returns.filter(purchase_transaction__vendor__name__icontains=search)
            # amount_filter = purchase_returns.filter(amount__icontains=search)
            product_name = purchase_returns.filter(purchases__product__name__icontains=search)
            
            # union() will merge the two QuerySets without duplicates.
            purchase_returns = name_filter.union(product_name)
            if search.isdigit():
                id = purchase_returns.filter(id__icontains=search)
                purchase_returns = purchase_returns.union(id)

        # ---------------------
        # 2) Date Range Filter
        # ---------------------
        # Only attempt date range filter if both start and end date are provided
        if start_date and end_date:
            start_date_obj = parse_date(start_date)
            end_date_obj = parse_date(end_date)
            if start_date_obj and end_date_obj:
                # Combine with min and max time to capture full day range
                start_datetime = datetime.combine(start_date_obj, datetime.min.time())
                end_datetime = datetime.combine(end_date_obj, datetime.max.time())

                purchase_returns = purchase_returns.filter(
                    date__range=(start_datetime, end_datetime)
                )

        # ---------------------------------
        # 3) Sort and Paginate the Results
        # ---------------------------------
        purchase_returns = purchase_returns.order_by('-id')  # Sorting

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set your desired page size
        paginated_data = paginator.paginate_queryset(purchase_returns, request)

        serializer = PurchaseReturnSerializer(paginated_data, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self,request):
        data = request.data 
        user = request.user
        enterprise = user.person.enterprise
        data['enterprise'] = enterprise.id 
        if "date" in data:
            date_str = data["date"]
            # Assuming the format is 'YYYY-MM-DD'
            date_object = datetime.strptime(date_str, '%Y-%m-%d').date()
            datetime_with_current_time = datetime.combine(date_object, timezone.now().time())
            data["date"] = datetime_with_current_time.isoformat()
        serializer = PurchaseReturnSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request,pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        purchase_return = PurchaseReturn.objects.filter(id=pk).first()
        serializer = PurchaseReturnSerializer()
        serializer.delete(purchase_return)
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class SalesReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request):
        

        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        sales = Sales.objects.filter(sales_transaction__enterprise = request.user.person.enterprise)
        if search:
            first_date_of_month = timezone.now().replace(day=1)
            today = timezone.now()
            sales = sales.filter(product__brand__name__icontains = search)
            sales = sales.filter(sales_transaction__date__date__range=(first_date_of_month,today))


        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            start_date = make_aware(datetime.combine(start_date, time.min))
            end_date = make_aware(datetime.combine(end_date, time.max))
            sales = sales.filter(sales_transaction__date__range=(start_date, end_date))

        
        if not search and not start_date and not end_date:
            sales = sales.filter(sales_transaction__date__date = timezone.now().date())

        count = sales.count()

        total_profit = 0
        total_sales = 0
        list = []
        for sale in sales:
            purchase = Purchase.objects.filter(product = sale.product).first()
            #print(purchase.unit_price)
            profit = (sale.unit_price - purchase.unit_price) * sale.quantity
            total_profit += profit
            total_sales += sale.unit_price
            local_dt = localtime(sale.sales_transaction.date)
            list.append({
                "date": local_dt.date(),
                "brand": sale.product.brand.name,
                "quantity": sale.quantity,
                "product": sale.product.name,
                "unit_price": sale.unit_price,
                "profit": profit
            })
        
        list.append({
            "total_profit": total_profit,
            "total_sales": total_sales,
            "count": count
        })
        return Response(list)
    

  
class NextBillNo(APIView):
    def get(self,request):
        max_bill_no = SalesTransaction.objects.filter(
            enterprise=request.user.person.enterprise
        ).aggregate(max_bill_no=Max('bill_no'))['max_bill_no']
        
        if max_bill_no is None:
            next_bill_no = 1
        else:
            next_bill_no = max_bill_no + 1
        
        return Response({'bill_no':next_bill_no})