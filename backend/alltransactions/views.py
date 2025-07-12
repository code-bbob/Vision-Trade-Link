from django.shortcuts import render
from rest_framework.response import Response
from .serializers import PurchaseTransactionSerializer,PurchaseReturnSerializer,SalesTransactionSerializer,SalesReturnSerializer,VendorSerializer,VendorTransactionSerializer,StaffTransactionSerializer,StaffSerializer
from rest_framework.views import APIView
from rest_framework import status
from .models import PurchaseTransaction,SalesTransaction,Vendor,VendorTransactions,SalesReturn,Purchase,Sales,PurchaseReturn,StaffTransactions,Staff
from rest_framework.permissions import IsAuthenticated
from allinventory.models import Product,Brand
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import date, datetime,time
from django.utils.dateparse import parse_date
from rest_framework.pagination import PageNumberPagination
from django.utils.timezone import make_aware,localtime
from django.db.models import Max,Q
from .models import Customer
from django.db import transaction
from .models import Debtor, DebtorTransaction
from .serializers import DebtorSerializer, DebtorTransactionSerializer


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
    
    def get(self, request,pk=None,branch=None, format=None):
        print("HERE")
        user = request.user
        enterprise = user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        transactions = PurchaseTransaction.objects.filter(enterprise=enterprise)

        if pk:
            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
            serializer = PurchaseTransactionSerializer(purchase_transaction)
            return Response(serializer.data)
        
        if branch:
            transactions = PurchaseTransaction.objects.filter(enterprise=enterprise,branch=branch)
        
        if search:
            phone_transactions = transactions.filter(purchase__product__name__startswith = search)
            vendor_trasactions = transactions.filter(vendor__name__icontains = search)
            bill_transactions = transactions.filter(bill_no__iexact = search)
            transactions = phone_transactions.union(vendor_trasactions,bill_transactions)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            transactions = PurchaseTransaction.objects.filter(
                date__range=(start_date, end_date)
            )

        transactions = transactions.order_by('-date','-id')


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
    
    def delete(self, request, pk, format=None):
        with transaction.atomic():
            role = request.user.person.role
            if role != "Admin":
                return Response("Unauthorized")

            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
            purchases = purchase_transaction.purchase.all()
            returned_amount = 0

            # In‐memory caches
            products_cache = {}
            brands_cache = {}

            for purchase in purchases:
                if not purchase.returned:
                    # Cache and update product
                    pid = purchase.product.id
                    if pid not in products_cache:
                        products_cache[pid] = purchase.product
                    product = products_cache[pid]
                    product.count -= purchase.quantity
                    product.stock -= purchase.quantity * product.selling_price

                    # Cache and update brand
                    bid = product.brand.id
                    if bid not in brands_cache:
                        brands_cache[bid] = product.brand
                    brand = brands_cache[bid]
                    brand.count -= purchase.quantity
                    brand.stock -= purchase.quantity * product.selling_price
                else:
                    returned_amount += purchase.total_price

            # Save each unique product and brand once
            for product in products_cache.values():
                product.save()
            for brand in brands_cache.values():
                brand.save()

            # Remove any related vendor transactions
            vts = VendorTransactions.objects.filter(purchase_transaction=purchase_transaction)
            for vt in vts:
                vt.delete()

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
        
    def get(self, request,pk=None,branch=None, format=None):
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
        
        if branch:
            transactions = SalesTransaction.objects.filter(enterprise=enterprise,branch=branch)
        
        if search:
            product_transactions = transactions.filter(sales__product__name__startswith = search)
            customer_transactions = transactions.filter(name__icontains = search)
            phone_transactions = transactions.filter(phone_number__icontains = search)
            transactions = product_transactions.union(customer_transactions,phone_transactions)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            
            transactions = SalesTransaction.objects.filter(
                date__range=(start_date, end_date)
            )

        transactions = transactions.order_by('-date','-id')


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

    @transaction.atomic
    def delete(self, request, pk, format=None):
        sales_transaction = SalesTransaction.objects.get(id=pk)
        role = request.user.person.role
        modify_stock = request.GET.get('flag')
        if role != "Admin":
            return Response("Unauthorized")
        if modify_stock == 'false':
            sales_transaction.delete()
            return Response("Deleted")

        sales = sales_transaction.sales.all()
        bonuses = sales_transaction.bonus.all()

        # Memory caches for products and brands
        products_cache = {}
        brands_cache = {}
        bonus_product_cache = {}
        bonus_brand_cache = {}

        for sale in sales:
            # preserve your original check
            if not sale.returned:
                # cache and update product
                pid = sale.product.id
                if pid not in products_cache:
                    products_cache[pid] = sale.product
                product = products_cache[pid]
                product.count += sale.quantity
                product.stock += sale.product.selling_price * sale.quantity

                # cache and update brand
                bid = product.brand.id
                if bid not in brands_cache:
                    brands_cache[bid] = product.brand
                brand = brands_cache[bid]
                brand.count += sale.quantity
                brand.stock += sale.product.selling_price * sale.quantity
        
        for sale in bonuses:
            pid = sale.product.id
            if pid not in products_cache:
                products_cache[pid] = sale.product
            product = products_cache[pid]
            product.count += sale.quantity
            product.stock += sale.product.selling_price * sale.quantity

            # cache and update brand
            bid = product.brand.id
            if bid not in brands_cache:
                brands_cache[bid] = product.brand
            brand = brands_cache[bid]
            brand.count += sale.quantity
            brand.stock += sale.product.selling_price * sale.quantity
        # save each unique product and brand once

        for product in products_cache.values():
            product.save()
        for brand in brands_cache.values():
            brand.save()

        dts = DebtorTransaction.objects.filter(all_sales_transaction=sales_transaction)
        for dt in dts:
            dt.delete()

        sales_transaction.delete()
        return Response("Deleted")

        
class VendorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,branch=None,*args, **kwargs):
        id = request.GET.get("id")
        role = request.user.person.role
        if id:
            vendors = Vendor.objects.get(id=id)
        vendors = Vendor.objects.filter(enterprise = request.user.person.enterprise)
        print(vendors)
        if branch:
            vendors = Vendor.objects.filter(branch = branch)
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

    def get(self,request,branch=None,pk=None):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        if pk:
            vendor_transactions = VendorTransactions.objects.get(id=pk)
            serializer = VendorTransactionSerializer(vendor_transactions)
            return Response(serializer.data)
        query = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        vendor_transactions = VendorTransactions.objects.filter(enterprise = request.user.person.enterprise)
        if branch:
            vendor_transactions = vendor_transactions.filter(branch = branch)
        if query:
            vendor_transactions_name = vendor_transactions.filter(vendor__name__icontains=query,enterprise = request.user.person.enterprise)
            vendor_transactions_brand = vendor_transactions.filter(vendor__brand__name__icontains=query,enterprise = request.user.person.enterprise)
            vendor_transactions = vendor_transactions_name.union(vendor_transactions_brand)

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            
            vendor_transactions = vendor_transactions.filter(
                date__range=(start_date, end_date)
            )

        vendor_transactions = vendor_transactions.order_by('-date','-id')

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(vendor_transactions, request)

        serializer = VendorTransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self,request,*args, **kwargs):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        serializer = VendorTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self,request,pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        vendor_transaction = VendorTransactions.objects.get(id=pk)
        serializer = VendorTransactionSerializer(vendor_transaction,data=data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        vendor_transaction = VendorTransactions.objects.get(id=pk)
        vendor_transaction.delete()
        return Response("Deleted")
    
class StatsView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self,request):
        print("HERE")

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if not start_date or not end_date:
            today = timezone.now().date()
            start_date = today.replace(day=1)  # First day of the current month
            end_date = today
        
        start_date = parse_date(start_date) if isinstance(start_date, str) else start_date
        end_date = parse_date(end_date) if isinstance(end_date, str) else end_date


        enterprise = request.user.person.enterprise
    
        allstock = Product.objects.filter(brand__enterprise = enterprise).count()
        allbrands = Brand.objects.filter(enterprise = enterprise).count()

        monthlypurchases = Purchase.objects.filter(purchase_transaction__enterprise = enterprise,purchase_transaction__date__range=(start_date, end_date))
        monthlysales = Sales.objects.filter(sales_transaction__enterprise = enterprise,sales_transaction__date__range=(start_date, end_date))

        dailypurchases = Purchase.objects.filter(purchase_transaction__enterprise = enterprise,purchase_transaction__date = today)
        dailysales = Sales.objects.filter(sales_transaction__enterprise = enterprise,sales_transaction__date = today)




        ptamt = 0
        dailyptamt = 0

        pts = PurchaseTransaction.objects.filter(enterprise = enterprise,date__range=(start_date, end_date))
        if pts:
            for pt in pts:
                # #print(pt.total_amount)
                ptamt = (pt.total_amount+ptamt) if pt.total_amount else ptamt

        pts = PurchaseTransaction.objects.filter(enterprise = enterprise,date = today)
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
        
        sts = SalesTransaction.objects.filter(enterprise=enterprise,date = today)
        if sts:
            for st in sts:
                dailystamt = (st.total_amount + dailystamt) if st.total_amount else dailystamt

        daily_profit = 0
        for sale in dailysales:
            product = sale.product
            daily_profit += sale.unit_price - product.cost_price

        daily_profit = dailystamt-dailyptamt
        
        monthly_profit = 0

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
    

class PurchaseReturnView(APIView):

    permission_classes = [IsAuthenticated]


    def get(self, request,branch=None):
        enterprise = request.user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        # Base QuerySet
        purchase_returns = PurchaseReturn.objects.filter(enterprise=enterprise)

        if branch:
            purchase_returns = purchase_returns.filter(branch=branch)

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
            start_datetime = parse_date(start_date)
            end_datetime = parse_date(end_date)
            if start_datetime and end_datetime:
                # Combine with min and max time to capture full day range

                purchase_returns = purchase_returns.filter(
                    date__range=(start_datetime, end_datetime)
                )

        # ---------------------------------
        # 3) Sort and Paginate the Results
        # ---------------------------------
        purchase_returns = purchase_returns.order_by('-date','-id')  # Sorting

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
            data["date"] = date_object
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
        purchase = purchase_return.purchases.first()
        purchase.returned = False
        serializer = PurchaseReturnSerializer()
        serializer.delete(purchase_return)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class SalesReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,branch=None):
        
        search = request.GET.get('search')
        phone = request.GET.get('phone')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        product = request.GET.get('product')
        include_returns = request.GET.get('include_returns', 'false').lower() == 'true'

        # Get all sales (including returned ones if specified)
        if include_returns:
            sales = Sales.objects.filter(sales_transaction__enterprise = request.user.person.enterprise)
        else:
            sales = Sales.objects.filter(sales_transaction__enterprise = request.user.person.enterprise, returned = False)
        
        if branch:
            sales = sales.filter(sales_transaction__branch = branch)
        
        if search:
            # Search by brand name
            sales = sales.filter(product__brand__name__icontains = search)
        
        if phone:
            # Search by debtor phone number
            sales = sales.filter(sales_transaction__debtor__phone_number__icontains = phone)
        
        if product:
            sales = sales.filter(product__name__startswith = product)

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            sales = sales.filter(sales_transaction__date__range=(start_date, end_date))
        
        # If no date filter is applied, show today's sales
        if not start_date and not end_date:
            sales = sales.filter(sales_transaction__date = timezone.now().date())

        # Order by most recent first
        sales = sales.order_by('-sales_transaction__date', '-sales_transaction__id')

        count = sales.count()

        # Calculate totals
        total_sales = 0
        total_discount = 0
        cash_sales = 0
        total_returns = 0
        sales_transaction_ids = []
        cash_transaction_ids = []
        sales_list = []

        for sale in sales:
            # No profit calculation needed
            sale_amount = sale.total_price
            if sale.returned:
                total_returns += sale_amount
            else:
                total_sales += sale_amount
            
            # Get debtor information
            debtor_name = sale.sales_transaction.debtor.name if sale.sales_transaction.debtor else "Cash Customer"
            debtor_phone = sale.sales_transaction.debtor.phone_number if sale.sales_transaction.debtor else "N/A"
            
            # Build the sales data
            sales_list.append({
                "id": sale.id,
                "type": "return" if sale.returned else "sale",
                "date": sale.sales_transaction.date,
                "brand": sale.product.brand.name,
                "product": sale.product.name,
                "imei_number": sale.product.uid,  # Using UID as IMEI
                "phone": debtor_phone,
                "customer_name": debtor_name,
                "quantity": sale.quantity,
                "returned_quantity": sale.returned_quantity,
                "unit_price": sale.unit_price,
                "total_price": sale_amount,
                "method": sale.sales_transaction.method,
                "bill_no": sale.sales_transaction.bill_no,
                "discount": sale.sales_transaction.discount or 0,
                "is_returned": sale.returned
            })
            
            # Track unique transactions for discount calculation
            if sale.sales_transaction.id not in sales_transaction_ids:
                total_discount += sale.sales_transaction.discount or 0
                sales_transaction_ids.append(sale.sales_transaction.id)
            
            # Calculate cash sales
            if sale.sales_transaction.method == "cash" and sale.sales_transaction.id not in cash_transaction_ids:
                cash_transaction_ids.append(sale.sales_transaction.id)
                cash_sales += sale.sales_transaction.total_amount or 0
        
        # Summary data
        summary = {
            "count": count,
            "sales_count": Sales.objects.filter(sales_transaction__enterprise = request.user.person.enterprise, returned = False).count(),
            "returns_count": Sales.objects.filter(sales_transaction__enterprise = request.user.person.enterprise, returned = True).count(),
            "subtotal_sales": total_sales,
            "total_returns": total_returns,
            "total_discount": total_discount,
            "total_sales": total_sales - total_discount,
            "net_sales": total_sales - total_returns - total_discount,
            "cash_sales": cash_sales
        }
        
        # Add summary to the end of the sales list
        sales_list.append(summary)
        
        return Response(sales_list)
     
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
    
class StaffTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,pk=None,branch=None, staff_pk = None):
        if pk:
            staff_transactions = StaffTransactions.objects.get(id=pk)
            serializer = StaffTransactionSerializer(staff_transactions)
            return Response(serializer.data)

        query = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        staff_transactions = StaffTransactions.objects.filter(enterprise = request.user.person.enterprise)
        if branch:
            staff_transactions = staff_transactions.filter(branch = branch)

        if staff_pk:
            staff_transactions = staff_transactions.filter(staff = staff_pk)
        
        if query:
            staff_transactions = staff_transactions.filter(
                Q(staff__name__icontains=query) | Q(staff__branch__name__icontains=query)
            )

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            
            staff_transactions = staff_transactions.filter(
                date__range=(start_date, end_date)
            )

        staff_transactions = staff_transactions.order_by('-id')

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(staff_transactions, request)

        serializer = StaffTransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.person.enterprise.id
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        serializer = StaffTransactionSerializer(data=data)
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
        staff_transaction = StaffTransactions.objects.get(id=pk)
        serializer = StaffTransactionSerializer(staff_transaction,data=data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        staff_transaction = StaffTransactions.objects.get(id=pk)
        staff_transaction.delete()
        return Response("Deleted")
    
class StaffView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,branchId=None):
        staffs = Staff.objects.filter(enterprise = request.user.person.enterprise)
        if branchId:
            staffs = staffs.filter(branch = branchId)
        serializer = StaffSerializer(staffs,many=True)
        return Response(serializer.data)
    
class CustomerTotalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,pk):
        customer = Customer.objects.filter(phone_number=pk).first()
        if customer:
            sales = SalesTransaction.objects.filter(phone_number=customer.phone_number,enterprise=request.user.person.enterprise)
            total_amount = 0
            for sale in sales:
                total_amount += sale.total_amount
            return Response(f"RS. {total_amount}")
        else:
            customer = Customer.objects.create(phone_number=pk,enterprise=request.user.person.enterprise)
            return Response("Customer created")

class SalesReturnView(APIView):

    permission_classes = [IsAuthenticated]


    def get(self, request,branch=None):
        enterprise = request.user.person.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        # Base QuerySet
        sales_returns = SalesReturn.objects.filter(enterprise=enterprise)

        if branch:
            sales_returns = sales_returns.filter(branch=branch)

        # -----------------
        # 1) Search Filter
        # -----------------
        if search:
            name_filter = sales_returns.filter(sales_transaction__customer_name=search)
            # amount_filter = purchase_returns.filter(amount__icontains=search)
            product_name = sales_returns.filter(sales__product__name__icontains=search)
            
            # union() will merge the two QuerySets without duplicates.
            sales_returns = name_filter.union(product_name)
            if search.isdigit():
                id = sales_returns.filter(id__icontains=search)
                sales_returns = sales_returns.union(id)

        # ---------------------
        # 2) Date Range Filter
        # ---------------------
        # Only attempt date range filter if both start and end date are provided
        if start_date and end_date:
            start_datetime = parse_date(start_date)
            end_datetime = parse_date(end_date)
            if start_datetime and end_datetime:
                # Combine with min and max time to capture full day range

                sales_returns = sales_returns.filter(
                    date__range=(start_datetime, end_datetime)
                )

        # ---------------------------------
        # 3) Sort and Paginate the Results
        # ---------------------------------
        sales_returns = sales_returns.order_by('-date','-id')  # Sorting

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set your desired page size
        paginated_data = paginator.paginate_queryset(sales_returns, request)

        serializer = SalesReturnSerializer(paginated_data, many=True)
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
            data["date"] = date_object
        serializer = SalesReturnSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request,pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        purchase_return = SalesReturn.objects.filter(id=pk).first()
        serializer = SalesReturnSerializer()
        serializer.delete(purchase_return)
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class DebtorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branchId=None):
        enterprise = request.user.person.enterprise
        debtors = Debtor.objects.filter(enterprise=enterprise)
        
        if branchId:
            debtors = debtors.filter(branch=branchId)

        serializer = DebtorSerializer(debtors, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        serializer = DebtorSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        debtor = Debtor.objects.filter(id=pk).first()
        if not debtor:
            return Response("Debtor not found", status=status.HTTP_404_NOT_FOUND)
        debtor.delete()
        return Response("Deleted", status=status.HTTP_204_NO_CONTENT)
    
class DebtorTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, debtor_pk=None, pk=None, branch=None):
        enterprise = request.user.person.enterprise
        debtor_transactions = DebtorTransaction.objects.filter(enterprise=enterprise)
        
        query = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if branch:
            debtor_transactions = debtor_transactions.filter(branch=branch)

        if pk:
            debtor_transactions = DebtorTransaction.objects.filter(id=pk, enterprise=enterprise).first()
            serializer = DebtorTransactionSerializer(debtor_transactions)
            return Response(serializer.data)
        
        if debtor_pk:
            debtor_transactions = debtor_transactions.filter(debtor=debtor_pk)

        if query:
            debtor_transactions = debtor_transactions.filter(
                Q(debtor__name__icontains=query) | Q(debtor__branch__name__icontains=query)
            )

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:

            debtor_transactions = debtor_transactions.filter(
                date__range=(start_date, end_date)
            )

        debtor_transactions = debtor_transactions.order_by('-date','-id')


        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set your desired page size
        paginated_data = paginator.paginate_queryset(debtor_transactions, request)

        serializer = DebtorTransactionSerializer(paginated_data, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        serializer = DebtorTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        data = request.data
        data['enterprise'] = request.user.person.enterprise.id
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        debtor_transaction = DebtorTransaction.objects.get(id=pk)
        serializer = DebtorTransactionSerializer(debtor_transaction, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self, request, pk):
        role = request.user.person.role
        if role != "Admin":
            return Response("Unauthorized")
        debtor_transaction = DebtorTransaction.objects.filter(id=pk).first()
        if not debtor_transaction:
            return Response("Debtor Transaction not found", status=status.HTTP_404_NOT_FOUND)
        debtor_transaction.delete()
        return Response("Deleted", status=status.HTTP_204_NO_CONTENT)
    

class VendorStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, vendorId=None, branch=None):
        enterprise = request.user.person.enterprise
        vendor = Vendor.objects.filter(id=vendorId, enterprise=enterprise).first()
        vendor_transactions = VendorTransactions.objects.filter(enterprise=enterprise,vendor=vendor)

        if not vendor:
            return Response("Vendor not found", status=status.HTTP_404_NOT_FOUND)

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

    
        if start_date and end_date:
            vendor_transactions = vendor_transactions.filter(
                date__range=(start_date, end_date)
            )
        elif start_date and not end_date:
            vendor_transactions = vendor_transactions.filter(
                date__gte=start_date
            )
        elif not start_date and end_date:
            vendor_transactions = vendor_transactions.filter(
                date__lte=end_date
            )

        vendor_transactions = vendor_transactions.order_by('id')
        vendor = VendorSerializer(vendor).data 
        vts = VendorTransactionSerializer(vendor_transactions, many=True).data
        return Response({'vendor_data': vendor, 'vendor_transactions': vts})
    
class DebtorStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, debtorId=None, branch=None):
        enterprise = request.user.person.enterprise
        debtor = Debtor.objects.filter(id=debtorId, enterprise=enterprise).first()
        debtor_transactions = DebtorTransaction.objects.filter(enterprise=enterprise, debtor=debtor)

        if not debtor:
            return Response("Debtor not found", status=status.HTTP_404_NOT_FOUND)

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

    
        if start_date and end_date:
            debtor_transactions = debtor_transactions.filter(
                date__range=(start_date, end_date)
            )
        elif start_date and not end_date:
            debtor_transactions = debtor_transactions.filter(
                date__gte=start_date
            )
        elif not start_date and end_date:
            debtor_transactions = debtor_transactions.filter(
                date__lte=end_date
            )

        debtor_transactions = debtor_transactions.order_by('-date','id')
        debtor = DebtorSerializer(debtor).data
        dts = DebtorTransactionSerializer(debtor_transactions, many=True).data
        return Response({'debtor_data': debtor, 'debtor_transactions': dts})