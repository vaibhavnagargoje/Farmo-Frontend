# Farmo Frontend — Complete Documentation

> **Next.js 16 · React 19 · TypeScript · Tailwind CSS**
> Farm Equipment & Agricultural Services Booking Platform

---

## Table of Contents

1. [What is Farmo Frontend?](#1-what-is-farmo-frontend)
2. [Technology Stack](#2-technology-stack)
3. [Project Folder Structure — Complete Map](#3-project-folder-structure--complete-map)
4. [The Big Picture — How Everything Connects](#4-the-big-picture--how-everything-connects)
5. [lib/ — The Shared Utility Layer](#5-lib--the-shared-utility-layer)
   - [lib/api.ts — The API Configuration File](#libapits--the-api-configuration-file)
   - [lib/auth.ts — The Auth Utility File](#libauthts--the-auth-utility-file)
   - [lib/utils.ts — The General Utilities File](#libutilsts--the-general-utilities-file)
6. [app/api/ — The BFF API Routes (Backend For Frontend)](#6-appapi--the-bff-api-routes-backend-for-frontend)
   - [What is a BFF?](#what-is-a-bff)
   - [app/api/auth/ — Auth Routes](#appapiauthapp-api-auth)
   - [app/api/booking/ — Booking Routes](#appapibooking--booking-routes)
   - [app/api/profile/ — Profile Routes](#appapiprofile--profile-routes)
   - [app/api/services/ — Services Routes](#appapiservices--services-routes)
   - [app/api/partner/ — Partner Routes](#appapipartner--partner-routes)
7. [lib/api.ts vs app/api/ — The Most Important Distinction](#7-libapits-vs-appapi--the-most-important-distinction)
8. [contexts/ — React State Management](#8-contexts--react-state-management)
9. [middleware.ts — Route Guard](#9-middlewarets--route-guard)
10. [app/ — Pages and Routing](#10-app--pages-and-routing)
    - [Public Pages](#public-pages)
    - [Auth Pages](#auth-pages)
    - [Customer Pages](#customer-pages)
    - [Partner Pages](#partner-pages)
11. [components/ — UI Building Blocks](#11-components--ui-building-blocks)
    - [Layout Components](#layout-components)
    - [Feature Components](#feature-components)
    - [Onboarding Components](#onboarding-components)
    - [ui/ — Base Design System](#ui--base-design-system)
12. [styles/ and globals.css](#12-styles-and-globalscss)
13. [Configuration Files](#13-configuration-files)
14. [Authentication Flow — Step by Step](#14-authentication-flow--step-by-step)
15. [Booking Flow — Step by Step](#15-booking-flow--step-by-step)
16. [Data Flow Diagram](#16-data-flow-diagram)
17. [Environment Variables](#17-environment-variables)
18. [Common Patterns Used in This Codebase](#18-common-patterns-used-in-this-codebase)

---

## 1. What is Farmo Frontend?

Farmo is a **farm equipment and agricultural services booking platform** — think of it like Uber but for tractors, harvesters, and farm labourers. The frontend is a **Next.js** application that:

- Lets **farmers (customers)** browse and book farm services.
- Lets **partners (service providers — tractor owners, labourers, transporters)** list services and manage bookings.
- Talks to a **Django REST API backend** for all real data.
- Uses **phone number + OTP login** (no passwords).

---

## 2. Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16 | Full-stack React framework (pages + API routes) |
| **React** | 19 | UI components |
| **TypeScript** | ~5.x | Type safety across the whole codebase |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **Radix UI** | Various | Accessible headless UI primitives |
| **shadcn/ui** | Custom | Pre-built components using Radix + Tailwind |
| **React Hook Form** | 7.x | Form state management |
| **JWT Decode** | 4.x | Decoding JWT tokens (to check expiry) |
| **Lucide React** | 0.454 | Icons |
| **Sonner** | 1.x | Toast notifications |
| **Recharts** | 2.x | Charts for partner earnings dashboard |
| **Google Maps** | `@vis.gl/react-google-maps` | Location picking |
| **Vercel Analytics** | 1.x | Usage analytics |

---

## 3. Project Folder Structure — Complete Map

```
Farmo-Frontend/
│
├── .env.local                   ← Environment variables (secret, not in git)
├── .gitignore                   ← Git ignore rules
├── components.json              ← shadcn/ui configuration
├── middleware.ts                ← Route guard — runs BEFORE every page load
├── next.config.mjs              ← Next.js configuration
├── package.json                 ← Dependencies and scripts
├── postcss.config.mjs           ← PostCSS config for Tailwind
├── tsconfig.json                ← TypeScript configuration
│
├── app/                         ← ALL pages and API routes (Next.js App Router)
│   ├── globals.css              ← Global CSS for the app
│   ├── layout.tsx               ← ROOT layout — wraps every single page
│   ├── page.tsx                 ← Home page (/)
│   │
│   ├── api/                     ← *** NEXT.JS API ROUTE HANDLERS ***
│   │   │                           (These are SERVER endpoints, not pages)
│   │   ├── auth/
│   │   │   ├── send-otp/
│   │   │   │   └── route.ts     ← POST /api/auth/send-otp
│   │   │   ├── verify-otp/
│   │   │   │   └── route.ts     ← POST /api/auth/verify-otp
│   │   │   ├── me/
│   │   │   │   └── route.ts     ← GET /api/auth/me
│   │   │   ├── logout/
│   │   │   │   └── route.ts     ← POST /api/auth/logout
│   │   │   ├── profile/
│   │   │   │   └── route.ts     ← POST /api/auth/profile
│   │   │   └── location/
│   │   │       └── route.ts     ← GET/POST /api/auth/location
│   │   │
│   │   ├── booking/
│   │   │   ├── route.ts         ← POST /api/booking (create booking)
│   │   │   ├── list/
│   │   │   │   └── route.ts     ← GET /api/booking/list
│   │   │   └── [bookingId]/
│   │   │       └── route.ts     ← GET/POST /api/booking/[id]
│   │   │
│   │   ├── profile/
│   │   │   └── route.ts         ← GET/PATCH /api/profile
│   │   │
│   │   ├── services/
│   │   │   ├── route.ts         ← GET /api/services
│   │   │   ├── categories/
│   │   │   │   └── route.ts     ← GET /api/services/categories
│   │   │   └── [serviceId]/
│   │   │       └── route.ts     ← GET /api/services/[id]
│   │   │
│   │   └── partner/
│   │       ├── onboarding/
│   │       │   └── route.ts     ← GET/POST /api/partner/onboarding
│   │       ├── bookings/
│   │       │   ├── route.ts     ← GET /api/partner/bookings
│   │       │   └── [bookingId]/
│   │       │       └── route.ts ← GET/POST /api/partner/bookings/[id]
│   │       └── services/
│   │           ├── route.ts     ← GET/POST /api/partner/services
│   │           └── [serviceId]/
│   │               └── route.ts ← GET/PATCH/DELETE /api/partner/services/[id]
│   │
│   ├── auth/
│   │   └── page.tsx             ← Login / OTP verification page (/auth)
│   │
│   ├── booking/
│   │   ├── new/                 ← New booking creation (/booking/new)
│   │   └── [id]/               ← Single booking detail (/booking/[id])
│   │
│   ├── bookings/
│   │   └── page.tsx             ← Customer's booking list (/bookings)
│   │
│   ├── categories/
│   │   └── page.tsx             ← All categories page (/categories)
│   │
│   ├── category/
│   │   └── [slug]/              ← Services in a category (/category/tractors)
│   │
│   ├── notifications/
│   │   └── page.tsx             ← Notifications page (/notifications)
│   │
│   ├── partner/
│   │   ├── page.tsx             ← Partner dashboard (/partner)
│   │   ├── earnings/            ← Partner earnings (/partner/earnings)
│   │   ├── job/                 ← Partner job management (/partner/job/[id])
│   │   ├── onboarding/          ← Partner onboarding wizard (/partner/onboarding)
│   │   ├── services/            ← Partner service management (/partner/services)
│   │   └── settings/            ← Partner settings (/partner/settings)
│   │
│   ├── profile/
│   │   └── page.tsx             ← Customer profile page (/profile)
│   │
│   ├── search/
│   │   ├── page.tsx             ← Search results (/search)
│   │   └── loading.tsx          ← Loading skeleton for search
│   │
│   ├── settings/
│   │   └── page.tsx             ← Customer settings (/settings)
│   │
│   └── support/
│       └── page.tsx             ← Support / Help page (/support)
│
├── components/                  ← REUSABLE React components
│   ├── account-layout.tsx       ← Layout wrapper for customer account pages
│   ├── bottom-nav.tsx           ← Mobile bottom navigation bar
│   ├── desktop-header.tsx       ← Desktop header/navbar
│   ├── equipment-card.tsx       ← Card showing a piece of equipment/service
│   ├── footer.tsx               ← Page footer
│   ├── GoogleMapPicker.tsx      ← Interactive map for location selection
│   ├── location-dropdown.tsx    ← Location selector dropdown
│   ├── mobile-header.tsx        ← Mobile top header bar
│   ├── notification-dropdown.tsx ← Notification bell dropdown
│   ├── otp-modal.tsx            ← OTP input modal
│   ├── partner-layout.tsx       ← Layout wrapper for partner pages
│   ├── popular-item-card.tsx    ← Card for popular services on home
│   ├── search-result-card.tsx   ← Card shown in search results
│   ├── service-tabs.tsx         ← Tabbed service category browser on home
│   ├── theme-provider.tsx       ← Dark/light theme wrapper
│   │
│   ├── onboarding/              ← Partner onboarding multi-step wizard steps
│   │   ├── personal-info-step.tsx
│   │   ├── kyc-details-step.tsx
│   │   ├── list-services-step.tsx
│   │   └── verification-step.tsx
│   │
│   └── ui/                      ← shadcn/ui base design system components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── ... (40+ components)
│
├── contexts/
│   └── auth-context.tsx         ← Global React auth state (useAuth hook)
│
├── lib/
│   ├── api.ts                   ← API URLs, TypeScript types, fetch helpers
│   ├── auth.ts                  ← Cookie names, token helpers, server auth utils
│   └── utils.ts                 ← General helpers (e.g., cn() for classnames)
│
├── public/                      ← Static assets (images, icons, etc.)
│
└── styles/
    └── globals.css              ← Additional global styles
```

---

## 4. The Big Picture — How Everything Connects

This is the **most important thing to understand** about this codebase. There are **three layers** of code, not two:

```
┌──────────────────────────────────────────────────────────┐
│                   BROWSER (Client)                        │
│                                                           │
│   React Components / Pages                               │
│   ↕ uses                                                  │
│   contexts/auth-context.tsx  (useAuth hook)              │
│   ↓ calls fetch() to...                                   │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP requests to /api/...
                   ↓
┌──────────────────────────────────────────────────────────┐
│           NEXT.JS SERVER (app/api/ routes)                │
│                                                           │
│   app/api/auth/send-otp/route.ts                         │
│   app/api/auth/verify-otp/route.ts                       │
│   app/api/booking/route.ts                               │
│   app/api/services/route.ts                              │
│   ... etc.                                                │
│                                                           │
│   These routes:                                          │
│   - Read/write HTTP-only cookies (tokens)                │
│   - Use lib/api.ts for the Django URL                    │
│   - Use lib/auth.ts for cookie helpers                   │
│   ↓ calls fetch() to...                                   │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP requests with Bearer token
                   ↓
┌──────────────────────────────────────────────────────────┐
│           DJANGO BACKEND (external server)                │
│                                                           │
│   http://127.0.0.1:8000/api/v1/...                       │
│   (Farmo-Backend Django REST Framework)                   │
└──────────────────────────────────────────────────────────┘
```

**Why this structure?** Security. The JWT access and refresh tokens are stored in **HTTP-only cookies** — meaning JavaScript in the browser CANNOT read them. Only the Next.js server can. This protects against XSS attacks stealing your tokens.

---

## 5. lib/ — The Shared Utility Layer

The `lib/` folder contains **pure utility code** — no React, no pages, no routes. Just configuration, types, and helper functions that are imported and used everywhere else.

### lib/api.ts — The API Configuration File

**This file is a dictionary of everything the app knows about the Django API.**

```
lib/api.ts contains:
├── API_BASE_URL           ← The Django server URL
├── API_ENDPOINTS          ← Every single Django API URL
├── TypeScript Interfaces  ← Shape of every data object
└── Fetch Helper Functions ← fetchWithAuth() and fetchPublic()
```

#### API_BASE_URL

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
```

This reads from `.env.local`. If not found, it defaults to local Django at port 8000.

#### API_ENDPOINTS

A constant object mapping every endpoint name to its full URL:

```typescript
export const API_ENDPOINTS = {
  // Auth
  SEND_OTP:    ".../users/auth/send-otp/",
  VERIFY_OTP:  ".../users/auth/verify-otp/",
  USER_PROFILE: ".../users/profile/",
  USER_LOCATION: ".../users/location/",

  // Partners
  PARTNER_STATUS:    ".../partners/status/",
  PARTNER_REGISTER:  ".../partners/register/",
  PARTNER_PROFILE:   ".../partners/profile/",
  PARTNER_DASHBOARD: ".../partners/dashboard/",
  PARTNER_PUBLIC:    (id) => ".../partners/[id]/",  ← function for dynamic URLs

  // Services
  CATEGORIES:        ".../services/categories/",
  SERVICES:          ".../services/",
  SERVICE_DETAIL:    (id) => ".../services/[id]/",
  MY_SERVICES:       ".../services/my/",

  // Bookings
  CUSTOMER_BOOKINGS:       ".../bookings/",
  CUSTOMER_BOOKING_DETAIL: (id) => ".../bookings/[id]/",
  CUSTOMER_BOOKING_CANCEL: (id) => ".../bookings/[id]/cancel/",
  PROVIDER_BOOKINGS:       ".../bookings/provider/list/",
  PROVIDER_BOOKING_ACTION: (id) => ".../bookings/provider/[id]/action/",
}
```

**Why this exists:** Instead of hard-coding the Django URL in 30 different files, everyone imports from here. If you need to change a URL, you change it in ONE place.

#### TypeScript Interfaces

These describe the **shape of data** coming from Django:

| Interface | What it represents |
|---|---|
| `User` | A logged-in user (id, phone, role, name) |
| `CustomerProfile` | Customer's address and location data |
| `AuthTokens` | access + refresh JWT pair |
| `SendOTPResponse` | Response from OTP send endpoint |
| `VerifyOTPResponse` | Response from OTP verify (includes user + tokens) |
| `PartnerProfile` | A service provider/partner's profile |
| `PartnerDashboard` | Stats for partner's dashboard page |
| `Category` | A service category (Tractors, Labour, etc.) |
| `Service` | A specific service listing |
| `Booking` | A complete booking record |
| `ApiError` | Standard error response shape |

These types are used throughout the entire app. For example, when you write `const [user, setUser] = useState<User | null>(null)`, the `User` type comes from `lib/api.ts`.

#### Fetch Helper Functions

```typescript
// Use when calling Django from server-side code WITH authentication
export async function fetchWithAuth(url, accessToken, options): Promise<Response>

// Use when calling Django from server-side code WITHOUT authentication (public endpoints)
export async function fetchPublic(url, options): Promise<Response>
```

These just wrap the native `fetch()` with the right headers. `fetchWithAuth` adds the `Authorization: Bearer <token>` header automatically.

---

### lib/auth.ts — The Auth Utility File

**This file is all about JWT tokens and cookies.**

```
lib/auth.ts contains:
├── Cookie name constants
├── Cookie option config
├── Token expiry times
├── isTokenExpired()     ← Checks if JWT is expired
├── getTokensFromCookies() ← Read cookies on server-side
├── setAuthCookies()     ← Write all 3 auth cookies
├── clearAuthCookies()   ← Delete all auth cookies (logout)
├── isAuthenticated()    ← Server-side auth check
└── getCurrentUser()     ← Server-side get current user
```

#### Cookie Names

```typescript
export const AUTH_COOKIE_NAME    = "farmo_access_token"   // HTTP-only JWT access token
export const REFRESH_COOKIE_NAME = "farmo_refresh_token"  // HTTP-only JWT refresh token
export const USER_COOKIE_NAME    = "farmo_user"           // NOT http-only, browser can read
```

**The three cookies explained:**

1. **`farmo_access_token`** — The JWT access token. **HTTP-only** (JavaScript cannot read it). Expires in **1 hour**. Used to authenticate API calls to Django. The Next.js server reads this when forwarding requests.

2. **`farmo_refresh_token`** — The JWT refresh token. **HTTP-only**. Expires in **7 days**. Used by the Next.js server to get a new access token when the old one expires, without asking the user to log in again.

3. **`farmo_user`** — A JSON string of the user object. **NOT HTTP-only** — the browser can read this with `document.cookie`. This is intentional: the React auth context reads it to display the user's name/role in the UI without making a server round-trip.

#### isTokenExpired()

```typescript
export function isTokenExpired(token: string): boolean
```

Decodes the JWT using `jwt-decode` library and compares the `exp` field to the current timestamp. Returns `true` if expired.

#### Server-side Functions

These functions use Next.js's `cookies()` from `"next/headers"` — **they only work in server-side code** (API routes, Server Components, Server Actions). You CANNOT call them from a React client component.

```typescript
getTokensFromCookies()  // Returns { accessToken, refreshToken, user }
setAuthCookies(...)     // Sets all 3 cookies
clearAuthCookies(...)   // Deletes all 3 cookies
isAuthenticated()       // Returns boolean
getCurrentUser()        // Returns User | null
```

---

### lib/utils.ts — The General Utilities File

Contains the `cn()` utility function (from shadcn/ui convention) that merges Tailwind class names intelligently:

```typescript
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

**Example usage:**
```tsx
<div className={cn("p-4 rounded", isActive && "bg-blue-500", className)}>
```

This is imported by virtually every component in the `components/ui/` folder.

---

## 6. app/api/ — The BFF API Routes (Backend For Frontend)

### What is a BFF?

A **Backend For Frontend (BFF)** is a server-side layer that sits between your browser and the real backend. In this project, the Next.js `app/api/` routes ARE the BFF.

```
Browser                Next.js Server              Django Backend
   │                        │                            │
   │  POST /api/auth/login  │                            │
   │ ─────────────────────► │                            │
   │                        │  POST .../verify-otp/      │
   │                        │ ──────────────────────────►│
   │                        │         { access, refresh, user }
   │                        │ ◄──────────────────────────│
   │                        │ (sets HTTP-only cookies)   │
   │    { user, message }   │                            │
   │ ◄──────────────────── │                            │
```

**Every `route.ts` file in `app/api/` is a Next.js Route Handler.** They export functions named after HTTP methods: `GET`, `POST`, `PATCH`, `DELETE`.

---

### app/api/auth/ — Auth Routes

#### `POST /api/auth/send-otp`
**File:** `app/api/auth/send-otp/route.ts`

- Receives `{ phone_number }` from the browser
- Forwards it to `API_ENDPOINTS.SEND_OTP` on Django
- Returns `{ message, otp? }` — in dev mode, Django may return the OTP for testing
- No authentication needed (public endpoint)

#### `POST /api/auth/verify-otp`
**File:** `app/api/auth/verify-otp/route.ts`

- Receives `{ phone_number, otp }` from the browser
- Forwards to Django's verify-otp endpoint
- Django returns `{ access, refresh, user, is_new_user }`
- **Sets 3 HTTP-only cookies** using `lib/auth.ts` helpers
- Returns `{ message, is_new_user, user }` to browser (NO tokens — they stay in cookies)

#### `GET /api/auth/me`
**File:** `app/api/auth/me/route.ts`

- Reads the `farmo_access_token` cookie from the server
- If expired, automatically tries to refresh it using the refresh token
- If refresh succeeds, updates the cookie and returns user data  
- If everything fails, returns 401
- Used by `auth-context.tsx` on app startup to restore auth state

#### `POST /api/auth/logout`
**File:** `app/api/auth/logout/route.ts`

- Deletes all 3 auth cookies (`farmo_access_token`, `farmo_refresh_token`, `farmo_user`)
- Returns `{ message: "Logged out successfully" }`
- Very simple — no Django call needed

#### `POST /api/auth/profile`
**File:** `app/api/auth/profile/route.ts`

- Receives profile update data `{ full_name, etc. }`
- Reads access token from cookies
- Forwards to `API_ENDPOINTS.USER_PROFILE` with Bearer token
- Returns updated profile from Django

#### `GET|POST /api/auth/location`
**File:** `app/api/auth/location/route.ts`

- GET: Fetches user's saved location
- POST: Saves user's location (lat/lng/address)
- Uses `fetchWithAuth()` helper with the stored access token
- Includes auto-refresh logic if token is expired

---

### app/api/booking/ — Booking Routes

#### `POST /api/booking`
**File:** `app/api/booking/route.ts`

Creates a new booking. Receives:
```json
{
  "service_id": 5,
  "scheduled_date": "2025-03-15",
  "scheduled_time": "09:00",
  "address": "Village Rampur, Dist. Agra",
  "lat": 27.123,
  "lng": 78.456,
  "quantity": 2,
  "note": "Need 2 tractors for ploughing"
}
```
- Reads access token from cookies
- Includes auto-refresh logic
- Forwards to `API_ENDPOINTS.CUSTOMER_BOOKINGS` on Django

#### `GET /api/booking/list`
**File:** `app/api/booking/list/route.ts`

- Fetches all bookings for the logged-in customer
- Calls `API_ENDPOINTS.CUSTOMER_BOOKINGS` with Bearer token

#### `GET|POST /api/booking/[bookingId]`
**File:** `app/api/booking/[bookingId]/route.ts`

- GET: Fetch single booking details
- POST: Perform an action on a booking (cancel, etc.)

---

### app/api/profile/ — Profile Routes

#### `GET /api/profile`
**File:** `app/api/profile/route.ts`

- Fetches the full user profile from `API_ENDPOINTS.USER_PROFILE`
- Requires authentication
- Includes auto-refresh token logic
- Used by the profile page to display and edit user data

#### `PATCH /api/profile`
**File:** `app/api/profile/route.ts`

- Updates the user profile
- Sends the updated data to Django
- The same file handles both GET and PATCH with separate exported functions

---

### app/api/services/ — Services Routes

#### `GET /api/services`
**File:** `app/api/services/route.ts`

Public endpoint (no auth needed). Accepts query params:
- `?category=tractors` — filter by category slug
- `?lat=27.1&lng=78.4&distance=50` — filter by location radius

Forwards to Django's public services endpoint.

#### `GET /api/services/categories`
**File:** `app/api/services/categories/route.ts`

- Returns all active service categories (Tractors, Harvesters, Labour, Transport, etc.)
- Public endpoint, no auth needed

#### `GET /api/services/[serviceId]`
**File:** `app/api/services/[serviceId]/route.ts`

- Returns full details for a single service listing

---

### app/api/partner/ — Partner Routes

#### `GET|POST /api/partner/onboarding`
**File:** `app/api/partner/onboarding/route.ts`

- GET: Check if a user is already a partner (`API_ENDPOINTS.PARTNER_STATUS`)
- POST: Register as a new partner (`API_ENDPOINTS.PARTNER_REGISTER`)
- Requires authentication

#### `GET /api/partner/bookings`
**File:** `app/api/partner/bookings/route.ts`

- Fetches all bookings assigned to the logged-in partner/provider
- Calls `API_ENDPOINTS.PROVIDER_BOOKINGS`

#### `GET|POST /api/partner/bookings/[bookingId]`
**File:** `app/api/partner/bookings/[bookingId]/route.ts`

- GET: Fetch single booking details for the partner
- POST: Perform provider actions (accept/reject/start/complete a booking)

#### `GET|POST /api/partner/services`
**File:** `app/api/partner/services/route.ts`

- GET: List the partner's own services (`API_ENDPOINTS.MY_SERVICES`)
- POST: Create a new service listing

#### `GET|PATCH|DELETE /api/partner/services/[serviceId]`
**File:** `app/api/partner/services/[serviceId]/route.ts`

- GET: Fetch single service details
- PATCH: Update a service listing
- DELETE: Remove a service listing

---

## 7. lib/api.ts vs app/api/ — The Most Important Distinction

This confusion is very common. Here is the definitive answer:

| | `lib/api.ts` | `app/api/` |
|---|---|---|
| **What is it?** | A TypeScript module (a file with exports) | Next.js Route Handlers (HTTP endpoints) |
| **Is it a server?** | NO — just a file with constants | YES — responds to HTTP requests |
| **Who uses it?** | Other TypeScript/TSX files via `import` | Browsers and client-side `fetch()` calls |
| **Where does it run?** | Wherever it's imported (server or client) | Always on the Next.js server |
| **What does it export?** | URLs, types, fetch helpers | Nothing — it handles HTTP requests |
| **Can you call it with fetch()** | NO | YES — e.g., `fetch("/api/auth/me")` |
| **Purpose** | Central configuration — DRY principle | Security proxy — hides tokens from browser |

### The relationship between them:

`app/api/` routes **import from** `lib/api.ts`:

```typescript
// Inside app/api/auth/send-otp/route.ts (a Route Handler):
import { API_ENDPOINTS } from "@/lib/api"  // ← Uses lib/api.ts for the URL

export async function POST(request: Request) {
  // Uses API_ENDPOINTS.SEND_OTP from lib/api.ts
  const response = await fetch(API_ENDPOINTS.SEND_OTP, { ... })
}
```

And client components call `app/api/` routes:

```typescript
// Inside contexts/auth-context.tsx (a Client Component):
// Does NOT import lib/api.ts at all
// Calls the Route Handler via fetch:
const response = await fetch("/api/auth/send-otp", {
  method: "POST",
  body: JSON.stringify({ phone_number }),
})
```

### Mental model:

```
lib/api.ts
│
│ is imported by
├── app/api/auth/send-otp/route.ts   ┐
├── app/api/booking/route.ts         │ These Next.js Route Handlers
├── app/api/services/route.ts        │ use lib/api.ts for Django URLs
└── app/page.tsx (server component)  ┘

app/api/auth/send-otp/route.ts   ← Browser calls this via fetch("/api/auth/send-otp")
app/api/booking/route.ts         ← Browser calls this via fetch("/api/booking")
```

---

## 8. contexts/ — React State Management

### contexts/auth-context.tsx

This provides **global React state** for authentication across the entire app.

**How it works:**

```typescript
// 1. Define the shape of auth state
interface AuthContextType {
  user: User | null          // Currently logged-in user (null if not logged in)
  isLoading: boolean         // True while checking auth status
  isAuthenticated: boolean   // Shorthand for !!user
  login: (phone, otp) => Promise<...>   // Call OTP verify endpoint
  logout: () => Promise<void>            // Call logout endpoint + redirect
  sendOtp: (phone) => Promise<...>       // Call send-OTP endpoint
  refreshUser: () => Promise<void>       // Re-fetch user from server
}
```

**On App Startup:**

1. `AuthProvider` mounts in `app/layout.tsx`
2. It immediately reads `farmo_user` cookie from `document.cookie` to display the user quickly
3. Simultaneously makes a `GET /api/auth/me` call to verify the session server-side
4. If server confirms the session, updates `user` state
5. If session is invalid, sets `user = null`

**How to use it in any component:**

```typescript
import { useAuth } from "@/contexts/auth-context"

function MyComponent() {
  const { user, isAuthenticated, login, logout, sendOtp } = useAuth()

  if (!isAuthenticated) return <p>Please log in</p>
  return <p>Welcome, {user?.first_name}</p>
}
```

**The `AuthProvider` wraps the entire app in `app/layout.tsx`:**

```tsx
<AuthProvider>
  <div className="...">
    {children}           // Every page in the whole app
  </div>
</AuthProvider>
```

---

## 9. middleware.ts — Route Guard

The middleware is a special Next.js feature that runs **before every single page request** — it's like a security guard at the door.

**Location:** `middleware.ts` (root of project, NOT inside `app/`)

**What it does:**

```typescript
// Protected routes — need to be logged in
const protectedRoutes = [
  "/profile",
  "/bookings",
  "/booking",
  "/partner",
  "/category",
]

// Auth routes — if already logged in, don't show these
const authRoutes = ["/auth"]
```

**The rules:**

1. If a logged-out user tries to visit `/bookings` → redirected to `/auth?redirect=/bookings`
2. If a logged-in user tries to visit `/auth` → redirected to `/` (home)
3. If `/auth?redirect=/profile` was the login URL, after login → redirect to `/profile`

**How it checks authentication:**

It simply checks if the `farmo_access_token` OR `farmo_refresh_token` cookies exist. If either exists, the user is considered "authenticated" (the actual token validity is checked by the API routes). This is intentional — we don't want to do expensive JWT verification in the middleware (it runs on every request).

**The matcher config:**

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

This tells Next.js to run the middleware on ALL routes EXCEPT static files and images (for performance).

---

## 10. app/ — Pages and Routing

Next.js App Router uses **file-based routing**: the folder path becomes the URL.

### Public Pages

#### `app/page.tsx` — Home Page (`/`)
- Server Component (no `"use client"`)
- Fetches categories from `API_ENDPOINTS.CATEGORIES` at build/request time
- Uses `next: { revalidate: 3600 }` — cache for 1 hour, then re-fetch
- Renders: `DesktopHeader`, `MobileHeader`, `ServiceTabs`, `BottomNav`
- No authentication required

#### `app/search/page.tsx` — Search Results (`/search`)
- Allows searching for services by keyword and/or location
- Shows `search-result-card` components for each result

#### `app/categories/page.tsx` — All Categories (`/categories`)
- Shows a grid of all service categories

#### `app/category/[slug]/` — Category Detail (`/category/tractors`)
- Dynamic route — `[slug]` is the category identifier
- Shows all services within a category

### Auth Pages

#### `app/auth/page.tsx` — Login (`/auth`)
- Client component (`"use client"`)
- 3-step flow:
  1. **Step "phone"** — Enter phone number with country code selector
  2. **Step "otp"** — Enter 4-digit OTP sent via SMS
  3. **Step "register"** — (For new users) Enter name, village
- Uses `useAuth()` context for `sendOtp()` and `login()` methods
- In development, shows the OTP on screen for testing
- After login, redirects to `?redirect=` param or home

### Customer Pages

#### `app/bookings/page.tsx` — My Bookings (`/bookings`)
- Protected route (middleware redirects if not logged in)
- Shows list of all the customer's bookings
- Each booking shows: service name, date, status, amount

#### `app/booking/new/` — New Booking (`/booking/new`)
- The booking creation flow
- Picks date, time, address, quantity, adds notes
- Uses `GoogleMapPicker` component for location

#### `app/booking/[id]/` — Booking Detail (`/booking/[id]`)
- Shows full details of a single booking
- For in-progress jobs: shows OTP to share with the partner to start/end work

#### `app/profile/page.tsx` — Profile (`/profile`)
- View and edit customer profile (name, email, default address)
- Uses wrapped in `AccountLayout`

#### `app/notifications/page.tsx` — Notifications (`/notifications`)

#### `app/settings/page.tsx` — Settings (`/settings`)

#### `app/support/page.tsx` — Support (`/support`)

### Partner Pages

#### `app/partner/page.tsx` — Partner Dashboard (`/partner`)
- Shows stats: total bookings, completed jobs, pending jobs, total earnings
- Uses `Recharts` for charts
- Protected — must be logged in AND must be a partner

#### `app/partner/onboarding/` — Become a Partner (`/partner/onboarding`)
- Multi-step wizard to register as a service provider
- Steps: Personal Info → KYC Details → List Services → Verification
- Each step is a separate component in `components/onboarding/`

#### `app/partner/services/` — Manage Services (`/partner/services`)
- List, add, edit, delete the partner's own service listings

#### `app/partner/job/` — Job Management (`/partner/job/[id]`)
- Accept/reject a booking request
- Start job (verify OTP from customer)
- End job (verify OTP from customer)

#### `app/partner/earnings/` — Earnings (`/partner/earnings`)
- Shows earnings history and statistics

#### `app/partner/settings/` — Partner Settings

---

## 11. components/ — UI Building Blocks

### Layout Components

#### `components/account-layout.tsx`
Wraps customer account pages (`/profile`, `/bookings`, `/settings`). Provides:
- Sidebar navigation on desktop
- Top nav tabs on mobile

#### `components/partner-layout.tsx`
Wraps all partner pages (`/partner/*`). Provides:
- Partner sidebar with partner-specific navigation
- Mobile-friendly navigation

### Header/Nav Components

#### `components/desktop-header.tsx`
Top navigation for desktop screens (`lg:` breakpoint and above). Has a `variant` prop:
- `variant="farmer"` — shows the farmer/customer navigation
- `variant="partner"` — shows the partner navigation

#### `components/mobile-header.tsx`
Top bar for mobile screens. Shows:
- Farmo logo/brand
- Location selector
- Notification bell

#### `components/bottom-nav.tsx`
Fixed bottom navigation bar for mobile (like a mobile app tab bar). Items:
- Home, Search, Bookings, Partner/Profile

#### `components/footer.tsx`
Standard page footer. Shown on desktop home page.

### Feature Components

#### `components/service-tabs.tsx`
The main home page content. Shows service categories as tabs, and services within each tab. Receives `categories` as a prop from the home page server component.

#### `components/equipment-card.tsx`
A card showing a piece of equipment or service listing with:
- Thumbnail image
- Title, price, price unit
- Partner name and rating
- "Book Now" button

#### `components/popular-item-card.tsx`
A horizontal card for featured/popular services.

#### `components/search-result-card.tsx`
Shows a single service in the search results page.

#### `components/location-dropdown.tsx`
A dropdown that lets the user set their location (city/region).
- Used in the header for location-based filtering of services.

#### `components/notification-dropdown.tsx`
Renders the notification bell icon and a dropdown showing recent notifications.

#### `components/GoogleMapPicker.tsx`
Uses `@vis.gl/react-google-maps` to show an interactive Google Map where the user can:
- Click to pin a location
- Drag the marker
- The component returns `{ lat, lng, address }` to its parent

#### `components/otp-modal.tsx`
A modal dialog with a 4-digit OTP input. Used in the booking flow for start/end job OTP verification.

#### `components/theme-provider.tsx`
Wraps the app with `next-themes` for dark/light mode support.

### Onboarding Components

These are the 4 steps of the partner registration wizard:

#### `components/onboarding/personal-info-step.tsx`
Step 1: Collect partner's personal details:
- Full name, phone (pre-filled)
- Partner type: LABOR / MACHINERY_OWNER / TRANSPORTER
- Business name, about/bio
- Base city

#### `components/onboarding/kyc-details-step.tsx`
Step 2: Government ID verification:
- Aadhaar number
- PAN number
- Upload ID photos

#### `components/onboarding/list-services-step.tsx`
Step 3: Create the first service listing:
- Select category, set title
- Set price and price unit (per acre, per hour, per day)
- Upload service photos

#### `components/onboarding/verification-step.tsx`
Step 4: Review submitted information, submit for admin verification.

### ui/ — Base Design System

The `components/ui/` folder contains **shadcn/ui** components — pre-built, accessible components built on top of **Radix UI primitives** and styled with Tailwind CSS.

These are NOT custom-built from scratch — they are the standard shadcn/ui component library adapted for this project.

| Component | Radix UI Primitive | Purpose |
|---|---|---|
| `button.tsx` | None (custom) | All buttons in the app |
| `input.tsx` | None (custom) | Text input fields |
| `card.tsx` | None (custom) | Card containers |
| `dialog.tsx` | `@radix-ui/react-dialog` | Modal dialogs |
| `select.tsx` | `@radix-ui/react-select` | Dropdown selects |
| `tabs.tsx` | `@radix-ui/react-tabs` | Tab panels |
| `sheet.tsx` | `@radix-ui/react-dialog` | Slide-in side panels |
| `avatar.tsx` | `@radix-ui/react-avatar` | User avatar images |
| `badge.tsx` | None (custom) | Status badges |
| `skeleton.tsx` | None (custom) | Loading placeholder |
| `spinner.tsx` | None (custom) | Loading spinner |
| `toast.tsx` | `@radix-ui/react-toast` | Toast notifications |
| `form.tsx` | React Hook Form | Form field wrappers |
| `calendar.tsx` | `react-day-picker` | Date picker calendar |
| `chart.tsx` | `recharts` | Data visualization charts |
| `table.tsx` | None (custom) | Data tables |
| `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `sidebar.tsx` | Custom | Collapsible sidebar |
| `progress.tsx` | `@radix-ui/react-progress` | Progress bars |
| `switch.tsx` | `@radix-ui/react-switch` | Toggle switches |

---

## 12. styles/ and globals.css

There are two global CSS files:

| File | Purpose |
|---|---|
| `app/globals.css` | Main global CSS — imported by `app/layout.tsx` |
| `styles/globals.css` | Additional global styles |

These files contain:
- Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)
- CSS custom properties (variables) for the design system colors (used by shadcn/ui)
- Global base styles (font settings, scrollbar styles, etc.)

The CSS variables define the color theme:
```css
:root {
  --background: ...
  --foreground: ...
  --primary: ...      /* The main green/farm color */
  --muted: ...
  /* etc. */
}

.dark {
  /* Dark mode overrides */
}
```

---

## 13. Configuration Files

### `.env.local`
Secret environment variables (NOT committed to git):
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Variables prefixed with `NEXT_PUBLIC_` are **exposed to the browser**. Variables without the prefix are server-only.

### `next.config.mjs`
```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,   // Don't fail build on TypeScript errors
  },
  images: {
    unoptimized: true,         // Don't use Next.js image optimization
  },
}
```

The `images.unoptimized: true` is because the Django backend serves images directly and the project doesn't use the Next.js Image Optimization API.

### `tsconfig.json`
TypeScript configuration. Key setting:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]   // Allows imports like import { ... } from "@/lib/api"
    }
  }
}
```

The `@/` alias maps to the root of the project, so `@/lib/api` means `d:/FARMO/Farmo-Frontend/lib/api.ts`.

### `components.json`
shadcn/ui configuration. Tells the `shadcn` CLI where to put components, which CSS variables to use, etc.

### `postcss.config.mjs`
PostCSS configuration — enables Tailwind CSS processing.

### `middleware.ts`
Already covered in Section 9 above.

---

## 14. Authentication Flow — Step by Step

Here is the complete journey when a user logs in:

```
1. User opens /auth page (app/auth/page.tsx)
   - Client component with "use client"
   - Gets sendOtp, login from useAuth() hook

2. User enters phone number, clicks Send OTP
   - auth-context.tsx: sendOtp("9876543210") is called
   - fetch("POST /api/auth/send-otp", { phone_number: "9876543210" })
   - app/api/auth/send-otp/route.ts receives this
   - It calls API_ENDPOINTS.SEND_OTP on Django
   - Django sends an SMS (or returns debug OTP in dev)
   - Route returns { message: "OTP sent" }

3. User enters the 4-digit OTP
   - auth-context.tsx: login("9876543210", "1234") is called
   - fetch("POST /api/auth/verify-otp", { phone_number, otp })
   - app/api/auth/verify-otp/route.ts receives this
   - It calls API_ENDPOINTS.VERIFY_OTP on Django
   - Django verifies OTP, returns { access, refresh, user, is_new_user }
   - Route Handler sets 3 cookies:
     ✓ farmo_access_token (httpOnly, 1 hour)
     ✓ farmo_refresh_token (httpOnly, 7 days)
     ✓ farmo_user (readable, 7 days)
   - Route returns { message, is_new_user, user } to browser (NO tokens)

4. auth-context.tsx receives the response
   - setUser(data.user) — React state updated
   - isAuthenticated becomes true
   - UI re-renders showing logged-in state

5. If new user (is_new_user === true)
   - Goes to "register" step in auth page
   - User enters name, village
   - Calls POST /api/auth/profile with the data

6. User is redirected to home (or intended page from ?redirect=)
```

**Token Refresh Flow (automatic):**
```
Every API route call:
1. Read farmo_access_token from cookie
2. Check if expired (isTokenExpired())
3. If expired AND farmo_refresh_token exists:
   - POST to .../token/refresh/ with refresh token
   - Get new access token
   - Update farmo_access_token cookie
   - Continue with the original request
4. If refresh also fails → return 401 → user sees login screen
```

---

## 15. Booking Flow — Step by Step

```
1. Customer browses home page (/)
   - Server fetches categories from Django (no auth needed)
   - Shows service tabs

2. Customer selects a category/service
   - Clicks on service → /category/[slug] or service detail page

3. Customer clicks "Book Now"
   - If not logged in → middleware redirects to /auth?redirect=/booking/new
   - If logged in → goes to /booking/new

4. Customer fills booking form
   - Date picker (react-day-picker)
   - Time picker
   - GoogleMapPicker for location
   - Quantity, notes

5. Customer submits booking
   - fetch("POST /api/booking", { service_id, date, time, address, lat, lng, quantity })
   - app/api/booking/route.ts receives → reads accessToken cookie
   - Calls API_ENDPOINTS.CUSTOMER_BOOKINGS on Django
   - Django creates booking, broadcasts to nearby partners
   - Returns booking object with status "SEARCHING"

6. Partner receives booking request
   - Partner's /partner/job page refreshes
   - Calls GET /api/partner/bookings
   - Sees new pending booking

7. Partner accepts the booking
   - fetch("POST /api/partner/bookings/[id]", { action: "accept" })
   - Django confirms booking, notifies customer
   - Booking status → "CONFIRMED"

8. Partner starts the job
   - Customer shows start OTP to partner (visible in /booking/[id])
   - Partner enters OTP in /partner/job/[id]
   - Booking status → "IN_PROGRESS"

9. Partner completes the job
   - Customer shows end OTP to partner
   - Partner enters OTP
   - Booking status → "COMPLETED"

10. Payment and review
    - Customer is prompted to review and pay
```

---

## 16. Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                   lib/api.ts                     │
│  (Shared constants — imported by everything)     │
│                                                  │
│  API_ENDPOINTS ──────────────────────────────┐  │
│  TypeScript Types (User, Booking, Service...) │  │
│  fetchWithAuth() ──────────────────────────┐  │  │
└──────────────────────────────────────────── ┼──┼──┘
                                              │  │
                    ┌─────────────────────────┘  │
                    ↓                            ↓
          ┌─────────────────┐         ┌─────────────────────┐
          │  lib/auth.ts    │         │   app/api/**/route.ts│
          │ (Cookie utils)  │◄────────│   (Route Handlers)   │
          │                 │  uses   │                      │
          └───────┬─────────┘         └──────────┬──────────┘
                  │                              │
                  │ used by                      │ called by
                  ↓                              ↓
          ┌─────────────────────────────────────────────────┐
          │           Next.js Server                         │
          │  (Reads/writes cookies, proxies to Django)       │
          └─────────────────────────────────────────────────┘
                  ↑                              ↑
                  │                              │
          ┌───────┴────────┐                     │
          │ middleware.ts  │            fetch("/api/...") calls
          │ (Route guards) │                     │
          └───────┬────────┘          ┌──────────┴──────────┐
                  │                   │  contexts/           │
                  │ redirects         │  auth-context.tsx    │
                  ↓                   │  (useAuth hook)      │
          ┌──────────────────────┐    └──────────┬──────────┘
          │    app/ pages        │               │
          │  (React Components)  │◄──────────────┘
          │  page.tsx files      │  uses useAuth()
          └──────────────────────┘
```

---

## 17. Environment Variables

| Variable | Prefix | Where Used | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_` | `lib/api.ts`, API routes | Django backend URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `NEXT_PUBLIC_` | `GoogleMapPicker.tsx` | Google Maps API key |

**`NEXT_PUBLIC_` prefix** means the variable is embedded in the browser bundle — anyone can see it in their browser DevTools. Only use this prefix for non-secret values (public API URLs, public keys).

Variables WITHOUT `NEXT_PUBLIC_` are available ONLY on the Next.js server — never sent to the browser.

Your `.env.local` should look like:
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your_key_here
```

---

## 18. Common Patterns Used in This Codebase

### Pattern 1: Server Component fetching data

```tsx
// app/page.tsx - NO "use client" = Server Component
async function getCategories(): Promise<Category[]> {
  const res = await fetch(API_ENDPOINTS.CATEGORIES, {
    next: { revalidate: 3600 },  // Cache for 1 hour (ISR)
  })
  return res.json()
}

export default async function HomePage() {
  const categories = await getCategories()  // Fetch happens on server
  return <ServiceTabs categories={categories} />  // Pass data to client component
}
```

### Pattern 2: Client Component using auth

```tsx
"use client"

import { useAuth } from "@/contexts/auth-context"

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth()

  if (!isAuthenticated) return <p>Please log in</p>

  return (
    <div>
      <p>Hello {user?.first_name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Pattern 3: API Route Handler with token refresh

```typescript
// app/api/some-route/route.ts
export async function GET() {
  const cookieStore = await cookies()
  let accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value

  // If expired, try to refresh
  if (isTokenExpired(accessToken) && refreshToken) {
    const refreshRes = await fetch(".../token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken })
    })
    if (refreshRes.ok) {
      accessToken = (await refreshRes.json()).access
      cookieStore.set(AUTH_COOKIE_NAME, accessToken, { httpOnly: true, ... })
    }
  }

  // Now use the valid token
  const data = await fetchWithAuth(API_ENDPOINTS.SOME_ENDPOINT, accessToken)
  return NextResponse.json(data)
}
```

### Pattern 4: Dynamic API route segments

```typescript
// app/api/booking/[bookingId]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { bookingId } = params  // From URL: /api/booking/abc-123
  // ...
}
```

### Pattern 5: shadcn/ui component usage

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ServiceCard({ isActive }: { isActive: boolean }) {
  return (
    <Card className={cn("border", isActive && "border-primary")}>
      <CardHeader>
        <CardTitle>Tractor Service</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Book Now</Button>
      </CardContent>
    </Card>
  )
}
```

---

## Quick Reference: Where to Find Things

| I want to... | Go to... |
|---|---|
| Change the Django API URL | `.env.local` → `NEXT_PUBLIC_API_URL` |
| Add a new Django endpoint | `lib/api.ts` → `API_ENDPOINTS` |
| Add a new TypeScript type | `lib/api.ts` (add interface) |
| Create a new page | `app/[page-name]/page.tsx` |
| Create a new API endpoint | `app/api/[name]/route.ts` |
| Change auth cookie names | `lib/auth.ts` |
| Change which routes need login | `middleware.ts` → `protectedRoutes` |
| Change the global layout | `app/layout.tsx` |
| Add a new reusable component | `components/[name].tsx` |
| Add a new base UI component | `components/ui/[name].tsx` |
| Access the logged-in user | `useAuth()` hook from `contexts/auth-context.tsx` |
| Call an API from a component | `fetch("/api/...")` then handle response |

---

*Documentation generated for Farmo Frontend — Next.js 16 App Router architecture.*
