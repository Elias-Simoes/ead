# Authentication Module

This module handles user authentication and authorization for the EAD Platform.

## Features

- User registration (students only)
- User login with JWT tokens
- Token refresh mechanism
- Password reset functionality
- Rate limiting for login attempts
- Role-based access control (RBAC)

## API Endpoints

### POST /api/auth/register
Register a new student user.

**Request Body:**
```json
{
  "email": "student@example.com",
  "name": "John Doe",
  "password": "SecurePass123!",
  "gdprConsent": true
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    },
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student",
      "isActive": true
    }
  }
}
```

### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

### POST /api/auth/logout
Logout and revoke refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### POST /api/auth/forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-uuid",
  "password": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

## Authentication Middleware

### authenticate
Validates JWT token and adds user to request object.

```typescript
import { authenticate } from '@shared/middleware/auth.middleware';

router.get('/protected', authenticate, (req, res) => {
  // req.user contains { userId, email, role }
  res.json({ user: req.user });
});
```

### authorize
Restricts access based on user roles.

```typescript
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

// Only admins can access
router.get('/admin-only', authenticate, authorize('admin'), handler);

// Admins and instructors can access
router.get('/staff-only', authenticate, authorize('admin', 'instructor'), handler);
```

## Rate Limiting

Login endpoint is rate-limited to 5 attempts per 15 minutes per IP address.

## Security Features

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens with short expiration (15 minutes for access, 7 days for refresh)
- Refresh tokens stored in database and can be revoked
- Password reset tokens expire after 1 hour
- Rate limiting on login attempts
- GDPR consent tracking for students

## Database Tables

### users
Main user table with authentication data.

### refresh_tokens
Stores active refresh tokens.

### password_reset_tokens
Stores password reset tokens.

### students
Student-specific data including GDPR consent.

## Services

### PasswordService
Handles password hashing and verification.

### TokenService
Manages JWT token generation and validation.

### AuthService
Core authentication business logic.

## Error Codes

- `EMAIL_ALREADY_EXISTS` - Email is already registered
- `INVALID_CREDENTIALS` - Invalid email or password
- `USER_INACTIVE` - User account is inactive
- `MISSING_TOKEN` - No authentication token provided
- `INVALID_TOKEN` - Invalid JWT token
- `TOKEN_EXPIRED` - JWT token has expired
- `TOKEN_REVOKED` - Refresh token has been revoked
- `RATE_LIMIT_EXCEEDED` - Too many login attempts
- `INVALID_RESET_TOKEN` - Invalid password reset token
- `TOKEN_ALREADY_USED` - Password reset token already used
