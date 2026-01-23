# users views file # apps/users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import SendOTPSerializer, VerifyOTPSerializer, UserSerializer
import random

User = get_user_model()

# --- MOCK STORAGE ---
# In production, use Redis or a Database Model to store OTPs with expiration.
OTP_STORAGE = {} 

class SendOTPView(APIView):
    """
    Endpoint to trigger an OTP SMS.
    Body: { "phone_number": "1234567890" }
    """
    permission_classes = [] # Allow anyone to request OTP

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            
            # 1. Generate OTP
            otp = str(random.randint(1000, 9999))
            
            # 2. Store OTP (In memory for now)
            OTP_STORAGE[phone] = otp
            
            # 3. Send SMS (Mocked for existing code)
            print(f"--> SENT OTP {otp} to {phone}") 
            
            return Response({
                "message": "OTP sent successfully.",
                "debug_otp": otp # REMOVE THIS IN PRODUCTION
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    """
    Endpoint to verify OTP and return JWT Token.
    Body: { "phone_number": "1234567890", "otp": "1234" }
    """
    permission_classes = [] # Allow anyone to verify

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            incoming_otp = serializer.validated_data['otp']
            
            # 1. Check OTP
            stored_otp = OTP_STORAGE.get(phone)
            
            if stored_otp and stored_otp == incoming_otp:
                # OTP Matches!
                
                # 2. Get or Create User
                # Since User model has a signal to create CustomerProfile, that handles itself.
                user, created = User.objects.get_or_create(phone_number=phone)
                
                # If created, they are a CUSTOMER by default (from model default)
                if created:
                    user.role = User.Role.CUSTOMER
                    user.save()

                # 3. Clear the used OTP
                del OTP_STORAGE[phone]

                # 4. Generate JWT Tokens
                refresh = RefreshToken.for_user(user)

                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data,
                    'message': 'Login Successful',
                    'is_new_user': created
                }, status=status.HTTP_200_OK)
            
            return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)






# partners views file # apps/partners/views.py
# apps/partners/views.py
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import PartnerProfile, LaborDetails, MachineryDetails, TransportDetails
from .serializers import (
    PartnerProfileSerializer,
    PartnerRegistrationSerializer,
    PartnerProfileUpdateSerializer,
    LaborDetailsSerializer,
    MachineryDetailsSerializer,
    TransportDetailsSerializer
)


class PartnerRegistrationView(APIView):
    """
    POST: Register as a new Partner.
    A logged-in Customer can become a Partner by submitting this form.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if user already has a partner profile
        if hasattr(request.user, 'partner_profile'):
            return Response(
                {"error": "You are already registered as a Partner."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PartnerRegistrationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            partner = serializer.save()
            return Response({
                "message": "Partner registration successful. Awaiting KYC verification.",
                "partner": PartnerProfileSerializer(partner).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PartnerProfileView(APIView):
    """
    GET: View own Partner Profile.
    PUT/PATCH: Update own Partner Profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        partner = get_object_or_404(PartnerProfile, user=request.user)
        serializer = PartnerProfileSerializer(partner)
        
        # Include nested details based on type
        data = serializer.data
        if partner.partner_type == PartnerProfile.PartnerType.LABOR:
            if hasattr(partner, 'labor_details'):
                data['labor_details'] = LaborDetailsSerializer(partner.labor_details).data
        elif partner.partner_type == PartnerProfile.PartnerType.MACHINERY_OWNER:
            if hasattr(partner, 'machinery_details'):
                data['machinery_details'] = MachineryDetailsSerializer(partner.machinery_details).data
        elif partner.partner_type == PartnerProfile.PartnerType.TRANSPORTER:
            if hasattr(partner, 'transport_details'):
                data['transport_details'] = TransportDetailsSerializer(partner.transport_details).data
        
        return Response(data)

    def patch(self, request):
        partner = get_object_or_404(PartnerProfile, user=request.user)
        serializer = PartnerProfileUpdateSerializer(partner, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully.",
                "partner": PartnerProfileSerializer(partner).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PartnerPublicView(generics.RetrieveAPIView):
    """
    GET: Public view of a Partner's profile (for customers viewing a service provider).
    """
    queryset = PartnerProfile.objects.filter(is_verified=True)
    serializer_class = PartnerProfileSerializer
    permission_classes = []  # Public access
    lookup_field = 'id'


class PartnerDashboardView(APIView):
    """
    GET: Partner's dashboard stats (jobs, earnings overview).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        partner = get_object_or_404(PartnerProfile, user=request.user)
        
        # Get stats from related bookings
        from bookings.models import Booking
        
        total_bookings = partner.received_bookings.count()
        completed_jobs = partner.received_bookings.filter(status=Booking.Status.COMPLETED).count()
        pending_jobs = partner.received_bookings.filter(status=Booking.Status.PENDING).count()
        in_progress_jobs = partner.received_bookings.filter(status=Booking.Status.IN_PROGRESS).count()
        
        # Calculate total earnings from completed jobs
        from django.db.models import Sum
        total_earnings = partner.received_bookings.filter(
            status=Booking.Status.COMPLETED,
            payment_status=Booking.PaymentStatus.PAID
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        return Response({
            "business_name": partner.business_name,
            "is_verified": partner.is_verified,
            "rating": str(partner.rating),
            "stats": {
                "total_bookings": total_bookings,
                "completed_jobs": completed_jobs,
                "pending_jobs": pending_jobs,
                "in_progress_jobs": in_progress_jobs,
                "total_earnings": str(total_earnings)
            }
        })




#  services views file # apps/services/views.py
# apps/services/views.py
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404

from .models import Category, Service, ServiceImage
from .serializers import (
    CategorySerializer,
    ServiceListSerializer,
    ServiceDetailSerializer,
    ServiceCreateSerializer,
    ServiceUpdateSerializer,
    ServiceImageSerializer
)


# --- Category Views ---
class CategoryListView(generics.ListAPIView):
    """
    GET: List all active categories.
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = []  # Public


# --- Service Views (Public) ---
class ServiceListView(generics.ListAPIView):
    """
    GET: List all active services with filters and search.
    Publicly accessible for customers browsing.
    """
    serializer_class = ServiceListSerializer
    permission_classes = []  # Public
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'partner__business_name']
    ordering_fields = ['price', 'created_at', 'partner__rating']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Service.objects.filter(status=Service.Status.ACTIVE, is_available=True)
        
        # Manual filtering for category
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        price_unit = self.request.query_params.get('price_unit')
        if price_unit:
            queryset = queryset.filter(price_unit=price_unit.upper())
        
        return queryset


class ServiceDetailView(generics.RetrieveAPIView):
    """
    GET: View details of a single service.
    """
    queryset = Service.objects.filter(status=Service.Status.ACTIVE)
    serializer_class = ServiceDetailSerializer
    permission_classes = []  # Public
    lookup_field = 'id'


# --- Service Views (Partner Only) ---
class PartnerServiceListView(generics.ListCreateAPIView):
    """
    GET: List all services owned by the logged-in partner.
    POST: Create a new service.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ServiceCreateSerializer
        return ServiceListSerializer

    def get_queryset(self):
        # Only return services belonging to this partner
        if hasattr(self.request.user, 'partner_profile'):
            return Service.objects.filter(partner=self.request.user.partner_profile)
        return Service.objects.none()

    def create(self, request, *args, **kwargs):
        # Check if user is a partner
        if not hasattr(request.user, 'partner_profile'):
            return Response(
                {"error": "You must be a registered Partner to create services."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            service = serializer.save()
            return Response({
                "message": "Service created successfully.",
                "service": ServiceDetailSerializer(service, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PartnerServiceDetailView(APIView):
    """
    GET: View own service details.
    PATCH: Update own service.
    DELETE: Delete own service.
    """
    permission_classes = [IsAuthenticated]

    def get_service(self, request, service_id):
        """Helper to get service owned by current user."""
        if not hasattr(request.user, 'partner_profile'):
            return None
        return get_object_or_404(
            Service,
            id=service_id,
            partner=request.user.partner_profile
        )

    def get(self, request, service_id):
        service = self.get_service(request, service_id)
        if not service:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ServiceDetailSerializer(service, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, service_id):
        service = self.get_service(request, service_id)
        if not service:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ServiceUpdateSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Service updated successfully.",
                "service": ServiceDetailSerializer(service, context={'request': request}).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, service_id):
        service = self.get_service(request, service_id)
        if not service:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        service.delete()
        return Response({"message": "Service deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class ServiceImageUploadView(APIView):
    """
    POST: Upload additional images to a service.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, service_id):
        if not hasattr(request.user, 'partner_profile'):
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        service = get_object_or_404(
            Service,
            id=service_id,
            partner=request.user.partner_profile
        )
        
        images = request.FILES.getlist('images')
        if not images:
            return Response({"error": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        created_images = []
        for image in images:
            img = ServiceImage.objects.create(service=service, image=image)
            created_images.append(ServiceImageSerializer(img).data)
        
        return Response({
            "message": f"{len(created_images)} image(s) uploaded successfully.",
            "images": created_images
        }, status=status.HTTP_201_CREATED)


class ServiceImageDeleteView(APIView):
    """
    DELETE: Remove an image from a service.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, service_id, image_id):
        if not hasattr(request.user, 'partner_profile'):
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        image = get_object_or_404(
            ServiceImage,
            id=image_id,
            service_id=service_id,
            service__partner=request.user.partner_profile
        )
        
        image.delete()
        return Response({"message": "Image deleted successfully."}, status=status.HTTP_204_NO_CONTENT)





# bookings views file # apps/bookings/views.py
# apps/bookings/views.py
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Booking
from .serializers import (
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
    BookingStatusUpdateSerializer,
    BookingCancelSerializer
)


# --- Customer Booking Views ---
class CustomerBookingListView(generics.ListCreateAPIView):
    """
    GET: List all bookings for the logged-in customer.
    POST: Create a new booking.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer

    def get_queryset(self):
        return Booking.objects.filter(customer=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            booking = serializer.save()
            return Response({
                "message": "Booking created successfully. Waiting for provider confirmation.",
                "booking": BookingDetailSerializer(booking, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerBookingDetailView(APIView):
    """
    GET: View details of a specific booking.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, booking_id=booking_id, customer=request.user)
        serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(serializer.data)


class CustomerBookingCancelView(APIView):
    """
    POST: Cancel a booking (by customer).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, booking_id=booking_id, customer=request.user)
        
        serializer = BookingCancelSerializer(data=request.data, context={'booking': booking})
        if serializer.is_valid():
            booking.status = Booking.Status.CANCELLED
            booking.cancellation_reason = serializer.validated_data['reason']
            booking.cancelled_by = request.user
            booking.save()
            
            return Response({
                "message": "Booking cancelled successfully.",
                "booking": BookingListSerializer(booking).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Provider Booking Views ---
class ProviderBookingListView(generics.ListAPIView):
    """
    GET: List all bookings received by the logged-in partner.
    """
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'partner_profile'):
            return Booking.objects.none()
        
        status_filter = self.request.query_params.get('status')
        queryset = Booking.objects.filter(
            provider=self.request.user.partner_profile
        ).order_by('-created_at')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        
        return queryset


class ProviderBookingDetailView(APIView):
    """
    GET: View details of a booking received.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        if not hasattr(request.user, 'partner_profile'):
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        booking = get_object_or_404(
            Booking,
            booking_id=booking_id,
            provider=request.user.partner_profile
        )
        serializer = BookingDetailSerializer(booking, context={'request': request})
        return Response(serializer.data)


class ProviderBookingActionView(APIView):
    """
    POST: Take action on a booking (accept/reject/start/complete).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        if not hasattr(request.user, 'partner_profile'):
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        booking = get_object_or_404(
            Booking,
            booking_id=booking_id,
            provider=request.user.partner_profile
        )
        
        serializer = BookingStatusUpdateSerializer(
            data=request.data,
            context={'booking': booking}
        )
        
        if serializer.is_valid():
            action = serializer.validated_data['action']
            
            if action == 'accept':
                booking.status = Booking.Status.CONFIRMED
                # OTPs are auto-generated in the model's save() method
                message = "Booking accepted."
            
            elif action == 'reject':
                booking.status = Booking.Status.REJECTED
                booking.cancellation_reason = serializer.validated_data.get('rejection_reason')
                booking.cancelled_by = request.user
                message = "Booking rejected."
            
            elif action == 'start':
                booking.status = Booking.Status.IN_PROGRESS
                booking.work_started_at = timezone.now()
                message = "Job started."
            
            elif action == 'complete':
                booking.status = Booking.Status.COMPLETED
                booking.work_completed_at = timezone.now()
                
                # Update partner stats
                partner = request.user.partner_profile
                partner.jobs_completed += 1
                partner.save()
                
                message = "Job completed successfully."
            
            booking.save()
            
            return Response({
                "message": message,
                "booking": BookingDetailSerializer(booking, context={'request': request}).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderBookingCancelView(APIView):
    """
    POST: Cancel a booking (by provider).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        if not hasattr(request.user, 'partner_profile'):
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        
        booking = get_object_or_404(
            Booking,
            booking_id=booking_id,
            provider=request.user.partner_profile
        )
        
        serializer = BookingCancelSerializer(data=request.data, context={'booking': booking})
        if serializer.is_valid():
            booking.status = Booking.Status.CANCELLED
            booking.cancellation_reason = serializer.validated_data['reason']
            booking.cancelled_by = request.user
            booking.save()
            
            return Response({
                "message": "Booking cancelled successfully.",
                "booking": BookingListSerializer(booking).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
