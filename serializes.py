# users serializers file # apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the Custom User model.
    """
    class Meta:
        model = User
        fields = ['id', 'phone_number', 'email', 'role', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id', 'role', 'is_active']

class SendOTPSerializer(serializers.Serializer):
    """
    Validates the phone number for sending OTP.
    """
    phone_number = serializers.CharField(max_length=15, required=True)

class VerifyOTPSerializer(serializers.Serializer):
    """
    Validates the phone number and OTP for login.
    """
    phone_number = serializers.CharField(max_length=15, required=True)
    otp = serializers.CharField(max_length=6, min_length=4, required=True)






# partners urls file # partners/urls.py

# apps/partners/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PartnerProfile, LaborDetails, MachineryDetails, TransportDetails

User = get_user_model()

# --- Nested Detail Serializers ---
class LaborDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaborDetails
        fields = ['skill_card_photo', 'daily_wage_estimate', 'is_migrant_worker', 'skills']

class MachineryDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineryDetails
        fields = ['owner_dl_number', 'owner_dl_photo', 'fleet_size']

class TransportDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportDetails
        fields = ['driving_license_number', 'driving_license_photo', 'vehicle_insurance_photo', 'is_intercity_available']


# --- Main Partner Serializers ---
class PartnerProfileSerializer(serializers.ModelSerializer):
    """
    Read-only serializer to display Partner info (e.g., on a Service listing).
    """
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    
    class Meta:
        model = PartnerProfile
        fields = [
            'id', 'user', 'user_phone', 'partner_type', 'business_name', 'about',
            'is_verified', 'is_kyc_submitted', 'base_city', 'rating', 'jobs_completed', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'is_verified', 'rating', 'jobs_completed', 'created_at']


class PartnerRegistrationSerializer(serializers.ModelSerializer):
    """
    Used when a User registers as a Partner for the first time.
    """
    # Nested details (optional, based on partner_type)
    labor_details = LaborDetailsSerializer(required=False, allow_null=True)
    machinery_details = MachineryDetailsSerializer(required=False, allow_null=True)
    transport_details = TransportDetailsSerializer(required=False, allow_null=True)

    class Meta:
        model = PartnerProfile
        fields = [
            'partner_type', 'business_name', 'about', 'base_city',
            'aadhar_card_front', 'aadhar_card_back', 'pan_card',
            'labor_details', 'machinery_details', 'transport_details'
        ]

    def validate(self, attrs):
        partner_type = attrs.get('partner_type')
        
        # Ensure the correct nested details are provided based on type
        if partner_type == PartnerProfile.PartnerType.LABOR and not attrs.get('labor_details'):
            raise serializers.ValidationError({"labor_details": "Required for Labor partners."})
        if partner_type == PartnerProfile.PartnerType.MACHINERY_OWNER and not attrs.get('machinery_details'):
            raise serializers.ValidationError({"machinery_details": "Required for Machinery partners."})
        if partner_type == PartnerProfile.PartnerType.TRANSPORTER and not attrs.get('transport_details'):
            raise serializers.ValidationError({"transport_details": "Required for Transport partners."})
        
        return attrs

    def create(self, validated_data):
        # Pop nested data
        labor_data = validated_data.pop('labor_details', None)
        machinery_data = validated_data.pop('machinery_details', None)
        transport_data = validated_data.pop('transport_details', None)
        
        # Get the user from the request context
        user = self.context['request'].user
        
        # Create the main profile
        partner_profile = PartnerProfile.objects.create(user=user, **validated_data)
        
        # Update user role
        user.role = User.Role.PARTNER
        user.save()
        
        # Create the appropriate nested details
        if labor_data:
            LaborDetails.objects.create(partner=partner_profile, **labor_data)
        if machinery_data:
            MachineryDetails.objects.create(partner=partner_profile, **machinery_data)
        if transport_data:
            TransportDetails.objects.create(partner=partner_profile, **transport_data)
        
        return partner_profile


class PartnerProfileUpdateSerializer(serializers.ModelSerializer):
    """
    For updating existing Partner Profile (e.g., changing business name, uploading KYC).
    """
    class Meta:
        model = PartnerProfile
        fields = [
            'business_name', 'about', 'base_city',
            'aadhar_card_front', 'aadhar_card_back', 'pan_card', 'is_kyc_submitted'
        ]








# services serializers file # apps/services/serializers.py
# apps/services/serializers.py
from rest_framework import serializers
from .models import Category, Service, ServiceImage
from partners.serializers import PartnerProfileSerializer


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Service Categories.
    """
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'is_active']
        read_only_fields = ['id', 'slug']


class ServiceImageSerializer(serializers.ModelSerializer):
    """
    Serializer for Service Images.
    """
    class Meta:
        model = ServiceImage
        fields = ['id', 'image', 'is_thumbnail']
        read_only_fields = ['id']


class ServiceListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing services (e.g., search results).
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    partner_name = serializers.CharField(source='partner.business_name', read_only=True)
    partner_rating = serializers.DecimalField(source='partner.rating', max_digits=3, decimal_places=2, read_only=True)
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            'id', 'title', 'price', 'price_unit', 'category_name',
            'partner_name', 'partner_rating', 'is_available', 'thumbnail',
            'location_lat', 'location_lng', 'service_radius_km'
        ]

    def get_thumbnail(self, obj):
        thumbnail = obj.images.filter(is_thumbnail=True).first()
        if thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(thumbnail.image.url)
        return None


class ServiceDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer for viewing a single service.
    """
    category = CategorySerializer(read_only=True)
    partner = PartnerProfileSerializer(read_only=True)
    images = ServiceImageSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'title', 'description', 'price', 'price_unit', 'min_order_qty',
            'category', 'partner', 'status', 'is_available',
            'location_lat', 'location_lng', 'service_radius_km',
            'specifications', 'images', 'created_at', 'updated_at'
        ]


class ServiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for Partners to create a new Service.
    """
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Service
        fields = [
            'category', 'title', 'description', 'price', 'price_unit', 'min_order_qty',
            'location_lat', 'location_lng', 'service_radius_km', 'specifications', 'images'
        ]

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        
        # Get the partner profile from the authenticated user
        user = self.context['request'].user
        partner = user.partner_profile
        
        # Create the service
        service = Service.objects.create(partner=partner, **validated_data)
        
        # Create images
        for i, image in enumerate(images_data):
            ServiceImage.objects.create(
                service=service,
                image=image,
                is_thumbnail=(i == 0)  # First image is thumbnail
            )
        
        return service


class ServiceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for Partners to update their Service.
    """
    class Meta:
        model = Service
        fields = [
            'title', 'description', 'price', 'price_unit', 'min_order_qty',
            'is_available', 'location_lat', 'location_lng', 'service_radius_km', 'specifications'
        ]








# bookings serializers file # apps/bookings/serializers.py
# apps/bookings/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Booking
from services.serializers import ServiceListSerializer
from partners.serializers import PartnerProfileSerializer
from users.serializers import UserSerializer


class BookingListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing bookings.
    """
    service_title = serializers.CharField(source='service.title', read_only=True)
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_id', 'status', 'payment_status',
            'service_title', 'provider_name', 'customer_phone',
            'scheduled_date', 'scheduled_time', 'total_amount', 'created_at'
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer for viewing a booking.
    """
    service = ServiceListSerializer(read_only=True)
    provider = PartnerProfileSerializer(read_only=True)
    customer = UserSerializer(read_only=True)
    cancelled_by = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_id', 'status', 'payment_status',
            'customer', 'service', 'provider',
            'scheduled_date', 'scheduled_time',
            'work_started_at', 'work_completed_at',
            'start_job_otp', 'end_job_otp',
            'address', 'lat', 'lng',
            'quantity', 'unit_price', 'total_amount',
            'note', 'cancellation_reason', 'cancelled_by',
            'created_at', 'updated_at'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Hide OTPs based on who is viewing
        if request and request.user:
            # Customer sees start_job_otp (gives to provider)
            # Provider sees end_job_otp (gives to customer)
            if hasattr(request.user, 'partner_profile') and request.user.partner_profile == instance.provider:
                # Provider viewing - hide start_job_otp, show end_job_otp
                data['start_job_otp'] = '****' if data['start_job_otp'] else None
            else:
                # Customer viewing - hide end_job_otp, show start_job_otp
                data['end_job_otp'] = '****' if data['end_job_otp'] else None
        
        return data


class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for Customers to create a new Booking.
    """
    service_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Booking
        fields = [
            'service_id', 'scheduled_date', 'scheduled_time',
            'address', 'lat', 'lng', 'quantity', 'note'
        ]

    def validate_service_id(self, value):
        from services.models import Service
        try:
            service = Service.objects.get(id=value, status=Service.Status.ACTIVE, is_available=True)
        except Service.DoesNotExist:
            raise serializers.ValidationError("Service not found or not available.")
        return value

    def validate_scheduled_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Scheduled date cannot be in the past.")
        return value

    def validate(self, attrs):
        from services.models import Service
        service = Service.objects.get(id=attrs['service_id'])
        quantity = attrs.get('quantity', 1)
        
        # Check minimum order quantity
        if quantity < service.min_order_qty:
            raise serializers.ValidationError({
                "quantity": f"Minimum order quantity is {service.min_order_qty}."
            })
        
        return attrs

    def create(self, validated_data):
        from services.models import Service
        
        service_id = validated_data.pop('service_id')
        service = Service.objects.get(id=service_id)
        
        # Create booking with snapshot pricing
        booking = Booking.objects.create(
            customer=self.context['request'].user,
            service=service,
            provider=service.partner,
            unit_price=service.price,
            total_amount=service.price * validated_data.get('quantity', 1),
            **validated_data
        )
        
        return booking


class BookingStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating booking status (Provider actions).
    """
    action = serializers.ChoiceField(choices=['accept', 'reject', 'start', 'complete'])
    otp = serializers.CharField(max_length=6, required=False)
    rejection_reason = serializers.CharField(required=False)

    def validate(self, attrs):
        action = attrs.get('action')
        booking = self.context.get('booking')
        
        if action == 'accept' and booking.status != Booking.Status.PENDING:
            raise serializers.ValidationError("Can only accept PENDING bookings.")
        
        if action == 'reject':
            if booking.status != Booking.Status.PENDING:
                raise serializers.ValidationError("Can only reject PENDING bookings.")
            if not attrs.get('rejection_reason'):
                raise serializers.ValidationError({"rejection_reason": "Required when rejecting."})
        
        if action == 'start':
            if booking.status != Booking.Status.CONFIRMED:
                raise serializers.ValidationError("Can only start CONFIRMED bookings.")
            if attrs.get('otp') != booking.start_job_otp:
                raise serializers.ValidationError({"otp": "Invalid start OTP."})
        
        if action == 'complete':
            if booking.status != Booking.Status.IN_PROGRESS:
                raise serializers.ValidationError("Can only complete IN_PROGRESS bookings.")
            if attrs.get('otp') != booking.end_job_otp:
                raise serializers.ValidationError({"otp": "Invalid completion OTP."})
        
        return attrs


class BookingCancelSerializer(serializers.Serializer):
    """
    Serializer for cancelling a booking.
    """
    reason = serializers.CharField(required=True, min_length=10)

    def validate(self, attrs):
        booking = self.context.get('booking')
        
        if booking.status in [Booking.Status.COMPLETED, Booking.Status.CANCELLED]:
            raise serializers.ValidationError("Cannot cancel a completed or already cancelled booking.")
        
        if booking.status == Booking.Status.IN_PROGRESS:
            raise serializers.ValidationError("Cannot cancel a booking that is already in progress. Contact support.")
        
        return attrs
