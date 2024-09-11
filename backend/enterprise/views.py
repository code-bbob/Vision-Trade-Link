from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from repair.models import Repair
from repair.permissions import check_status
from django.utils.dateparse import parse_date
from datetime import datetime, date
from .serializers import AdminProfitSerializer,TechnicianProfitSerializer,OutsideRepairSerializer,PersonSerializer
from .models import Person,Outside

            
class PersonView(APIView):
    persmission_classes = [IsAuthenticated]

    def get(self,request):
        user= request.user
        enterprise = user.person.enterprise
        persons = Person.objects.filter(enterprise=enterprise)
        serializer = PersonSerializer(persons,many=True)
        return Response(serializer.data)
    
    def post(self,request):
        user = request.user
        data = request.data
        status = check_status(user)
        if status == "Admin":
            enterprise = user.person.enterprise.id
            data["enterprise"] = enterprise
            serializer = PersonSerializer(data=data)
            if serializer.is_valid(raise_exception=True):
                serializer.save()
                return Response(serializer.data)
        else:
            return Response("UNAUTHORIZED")
        
    def patch(self,request):
        user = request.user
        data = request.data
        id = data.get('id',None)
        if id:
            if check_status(user)=="Admin":
                person = Person.objects.get(user = id,enterprise = user.person.enterprise)
                if person:
                    serializer = PersonSerializer(person,data=data,partial=True)
                    if serializer.is_valid(raise_exception=True):
                        serializer.save()
                        return Response(serializer.data)
            else:
                return Response("NOT AUTHORIZED")
        else:
            return Response("NO SUCH TECHNICIAN")