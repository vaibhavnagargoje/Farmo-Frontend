# project url Farmo/urls.py
"""
URL configuration for Farmo project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),


    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # API V1 Routes
    # --- API VERSION 1 ---

    # Users App (Authentication & User Management)
    path('api/v1/users/', include('apps.users.urls', namespace='users')),
    
    # Partners App (Partner Registration & Management)
    path('api/v1/partners/', include('partners.urls', namespace='partners')),
    
    # Services App (Service Listings & Categories)
    path('api/v1/services/', include('services.urls', namespace='services')),
    
    # Bookings App (Customer & Provider Bookings)
    path('api/v1/bookings/', include('bookings.urls', namespace='bookings')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Include django_browser_reload URLs only in DEBUG mode
    urlpatterns += [
        path("__reload__/", include("django_browser_reload.urls")),
        
    ]




# users urls file # apps/users/urls.py

from django.urls import path
from .views import SendOTPView, VerifyOTPView

app_name = 'users' 

urlpatterns = [
    # OTP Authentication Routes
    path('auth/send-otp/', SendOTPView.as_view(), name='send-otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
]





# partners urls file # apps/partners/urls.py
# apps/partners/urls.py
from django.urls import path
from .views import (
    PartnerRegistrationView,
    PartnerProfileView,
    PartnerPublicView,
    PartnerDashboardView
)

app_name = 'partners'

urlpatterns = [
    # Partner Registration & Profile Management
    path('register/', PartnerRegistrationView.as_view(), name='register'),
    path('profile/', PartnerProfileView.as_view(), name='profile'),
    path('dashboard/', PartnerDashboardView.as_view(), name='dashboard'),
    
    # Public Partner View (for customers)
    path('<int:id>/', PartnerPublicView.as_view(), name='public-profile'),
]





# services urls file # apps/services/urls.py
# apps/services/urls.py
from django.urls import path
from .views import (
    CategoryListView,
    ServiceListView,
    ServiceDetailView,
    PartnerServiceListView,
    PartnerServiceDetailView,
    ServiceImageUploadView,
    ServiceImageDeleteView
)

app_name = 'services'

urlpatterns = [
    # Public Routes (Customers Browsing)
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('', ServiceListView.as_view(), name='service-list'),
    path('<int:id>/', ServiceDetailView.as_view(), name='service-detail'),
    
    # Partner Routes (Manage Own Services)
    path('my/', PartnerServiceListView.as_view(), name='partner-service-list'),
    path('my/<int:service_id>/', PartnerServiceDetailView.as_view(), name='partner-service-detail'),
    path('my/<int:service_id>/images/', ServiceImageUploadView.as_view(), name='service-image-upload'),
    path('my/<int:service_id>/images/<int:image_id>/', ServiceImageDeleteView.as_view(), name='service-image-delete'),
]






# bookings urls file # apps/bookings/urls.py
# apps/bookings/urls.py
from django.urls import path
from .views import (
    CustomerBookingListView,
    CustomerBookingDetailView,
    CustomerBookingCancelView,
    ProviderBookingListView,
    ProviderBookingDetailView,
    ProviderBookingActionView,
    ProviderBookingCancelView
)

app_name = 'bookings'

urlpatterns = [
    # Customer Routes
    path('', CustomerBookingListView.as_view(), name='customer-booking-list'),
    path('<str:booking_id>/', CustomerBookingDetailView.as_view(), name='customer-booking-detail'),
    path('<str:booking_id>/cancel/', CustomerBookingCancelView.as_view(), name='customer-booking-cancel'),
    
    # Provider Routes
    path('provider/list/', ProviderBookingListView.as_view(), name='provider-booking-list'),
    path('provider/<str:booking_id>/', ProviderBookingDetailView.as_view(), name='provider-booking-detail'),
    path('provider/<str:booking_id>/action/', ProviderBookingActionView.as_view(), name='provider-booking-action'),
    path('provider/<str:booking_id>/cancel/', ProviderBookingCancelView.as_view(), name='provider-booking-cancel'),
]


