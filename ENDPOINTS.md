# Pathfinders API Endpoints Documentation

## Overview
This document outlines the endpoint structure for the Pathfinders application, ensuring proper alignment between Django, FastAPI, and nginx routing.

## Endpoint Structure

### 1. Django REST Framework Endpoints (Port 8000)

#### Public Endpoints (No Authentication Required)
```
GET  /health/                    - Health check
GET  /api/health/                - API health check
POST /api/auth/login/            - User login
POST /api/auth/register/         - User registration
GET  /api/auth/csrf/             - Get CSRF token
POST /api/core/donate/anonymous/stripe/  - Anonymous Stripe donation
POST /api/core/donate/anonymous/mtn/     - Anonymous MTN donation
POST /api/core/stripe-webhook/   - Stripe webhook
POST /api/core/mtn-webhook/      - MTN webhook
```

#### Protected Endpoints (Authentication Required)
```
GET  /api/users/                 - List users (staff only)
POST /api/users/                 - Create user
GET  /api/users/{id}/            - Get user details
PUT  /api/users/{id}/            - Update user
DELETE /api/users/{id}/          - Delete user
GET  /api/auth/me/               - Get current user
GET  /api/auth/profile/          - Get user profile
PATCH /api/auth/profile/         - Update user profile
PUT  /api/auth/profile/          - Update user profile
GET  /api/auth/profile/{id}/     - Get specific profile
PATCH /api/auth/profile/{id}/    - Update specific profile
PUT  /api/auth/profile/{id}/     - Update specific profile
POST /api/auth/logout/           - User logout

GET  /api/questions/             - List questions
POST /api/questions/             - Create question
GET  /api/questions/{id}/        - Get question details
PUT  /api/questions/{id}/        - Update question
DELETE /api/questions/{id}/      - Delete question
GET  /api/questions/list_all/    - Get all questions for assessment

GET  /api/assessments/           - List assessments
POST /api/assessments/           - Create assessment
GET  /api/assessments/{id}/      - Get assessment details
PUT  /api/assessments/{id}/      - Update assessment
DELETE /api/assessments/{id}/    - Delete assessment
GET  /api/assessments/{id}/get_questions/  - Get questions for assessment
POST /api/assessments/{id}/start-assessment/  - Start assessment
POST /api/assessments/submit/    - Submit assessment answers
POST /api/assessments/save_progress/  - Save assessment progress
GET  /api/assessments/get_progress/  - Get assessment progress
GET  /api/assessments/latest-results/  - Get latest assessment results
POST /api/assessments/{id}/submit_assessment/  - Submit assessment
POST /api/assessments/{id}/submit_response/  - Submit response
POST /api/assessments/{id}/add_counselor_notes/  - Add counselor notes
GET  /api/assessments/assessment_count/  - Get assessment count

GET  /api/books/                 - List books
POST /api/books/                 - Create book
GET  /api/books/{id}/            - Get book details
PUT  /api/books/{id}/            - Update book
DELETE /api/books/{id}/          - Delete book

GET  /api/career-choices/        - List career choices
POST /api/career-choices/        - Create career choice
GET  /api/career-choices/{id}/   - Get career choice details
PUT  /api/career-choices/{id}/   - Update career choice
DELETE /api/career-choices/{id}/ - Delete career choice

GET  /api/career-notes/          - List career notes
POST /api/career-notes/          - Create career note
GET  /api/career-notes/{id}/     - Get career note details
PUT  /api/career-notes/{id}/     - Update career note
DELETE /api/career-notes/{id}/   - Delete career note

GET  /api/counselors/            - List counselors
POST /api/counselors/            - Create counselor
GET  /api/counselors/{id}/       - Get counselor details
PUT  /api/counselors/{id}/       - Update counselor
DELETE /api/counselors/{id}/     - Delete counselor

POST /api/core/donate/stripe/    - Create Stripe donation
POST /api/core/donate/mtn/       - Create MTN donation
GET  /api/core/donations/        - List donations
POST /api/core/donations/{id}/cancel/  - Cancel donation
GET  /api/core/donations/mtn/{reference_id}/status/  - Check MTN payment status
POST /api/core/validate-payment/ - Validate payment (legacy)
```

### 2. FastAPI Endpoints (Port 8001)

#### Public Endpoints (No Authentication Required)
```
GET  /                           - Root endpoint
GET  /health/                    - Health check
POST /calculate-gifts/           - Calculate motivational gifts
POST /progress/save/             - Save assessment progress
GET  /progress/{user_id}/        - Get assessment progress
```

### 3. Nginx Routing Configuration

#### Frontend Routes (Next.js - Port 3000)
```
/                               - Home page
/auth/*                         - Authentication pages
/dashboard/*                     - Dashboard pages
/counselor/*                     - Counselor pages
/counselor-access/*              - Counselor access pages
/donate/*                        - Donation pages
/books/*                         - Book pages
/assessments/*                   - Assessment pages
/profile/*                       - Profile pages
```

#### API Routes (Django - Port 8000)
```
/api/*                          - All Django API endpoints
/admin/*                         - Django admin
/health                         - Django health check
```

#### FastAPI Routes (FastAPI - Port 8001)
```
/fastapi/*                      - All FastAPI endpoints
/fastapi/health                 - FastAPI health check
```

#### Static Files
```
/static/*                       - Django static files
/media/*                        - Django media files
/_next/static/*                 - Next.js static files
```

## Authentication Flow

### Public Endpoints
- Health checks: `/health/`, `/api/health/`, `/fastapi/health/`
- Authentication: `/api/auth/login/`, `/api/auth/register/`, `/api/auth/csrf/`
- Anonymous donations: `/api/core/donate/anonymous/*`
- Webhooks: `/api/core/stripe-webhook/`, `/api/core/mtn-webhook/`

### Protected Endpoints
- All other API endpoints require authentication
- Session-based authentication for web interface
- Token-based authentication for API clients

## CORS Configuration

### Allowed Origins (Production)
- `https://pathfindersgifts.com`
- `https://www.pathfindersgifts.com`

### Allowed Origins (Development)
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:8000`
- `http://127.0.0.1:8000`

## Security Headers

### Nginx Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "Error message",
  "detail": "Additional details"
}
```

## Testing Endpoints

### Health Checks
```bash
# Django health check
curl -I https://pathfindersgifts.com/health/

# FastAPI health check
curl -I https://pathfindersgifts.com/fastapi/health/

# API health check
curl -I https://pathfindersgifts.com/api/health/
```

### Authentication Test
```bash
# Get CSRF token
curl -X GET https://pathfindersgifts.com/api/auth/csrf/

# Login
curl -X POST https://pathfindersgifts.com/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

## Troubleshooting

### Common Issues

1. **403 Forbidden on API endpoints**
   - Check if user is authenticated
   - Verify CSRF token is included in requests
   - Ensure proper session cookies are set

2. **404 Not Found on FastAPI endpoints**
   - Verify FastAPI service is running on port 8001
   - Check nginx configuration for `/fastapi/` routing
   - Ensure endpoint paths match exactly

3. **CORS errors**
   - Verify CORS settings in Django settings
   - Check nginx CORS headers
   - Ensure frontend origin is in allowed origins

4. **Authentication issues**
   - Check session configuration
   - Verify cookie settings
   - Ensure proper CSRF token handling

### Log Locations
- Django logs: `/var/log/pathfinders-django.log`
- FastAPI logs: `/var/log/pathfinders-fastapi.log`
- Nginx logs: `/var/log/nginx/error.log`
- Frontend logs: `/var/log/pathfinders-frontend.log` 