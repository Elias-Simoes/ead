# Authentication Module - Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## 📋 API Endpoints

### Register Student
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "name": "John Doe",
  "password": "SecurePass123!",
  "gdprConsent": true
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

### Logout
```bash
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

### Forgot Password
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```

### Reset Password
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-uuid",
  "password": "NewSecurePass123!"
}
```

## 🔐 Using Authentication

### Protect Routes
```typescript
import { authenticate, authorize } from '@shared/middleware/auth.middleware';

// Require authentication
router.get('/profile', authenticate, handler);

// Require specific role
router.get('/admin', authenticate, authorize('admin'), handler);

// Multiple roles allowed
router.get('/staff', authenticate, authorize('admin', 'instructor'), handler);
```

### Access User Data
```typescript
router.get('/me', authenticate, (req, res) => {
  // req.user contains: { userId, email, role }
  const { userId, email, role } = req.user;
  res.json({ userId, email, role });
});
```

## 🛡️ Security Features

| Feature | Configuration |
|---------|--------------|
| Password Hashing | bcrypt, 12 salt rounds |
| Access Token | 15 minutes expiration |
| Refresh Token | 7 days expiration |
| Login Rate Limit | 5 attempts / 15 minutes |
| Password Requirements | 8+ chars, uppercase, lowercase, number, special char |

## 📊 Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@plataforma-ead.com | Admin@123 | admin |

⚠️ **Change default password in production!**

## 🗄️ Database Tables

- `users` - Main user table
- `refresh_tokens` - Active refresh tokens
- `password_reset_tokens` - Password reset tokens
- `students` - Student-specific data

## 🔧 Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/plataforma_ead
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key

# Optional (with defaults)
PORT=3000
BCRYPT_SALT_ROUNDS=12
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
```

## 📝 Common Tasks

### Run Migrations
```bash
npm run migrate
```

### Start Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

### Format Code
```bash
npm run format
```

## ❌ Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid input data (with field details) |
| EMAIL_ALREADY_EXISTS | Email is already registered |
| INVALID_CREDENTIALS | Invalid email or password |
| USER_INACTIVE | User account is inactive |
| MISSING_TOKEN | No authentication token provided |
| INVALID_TOKEN | Invalid JWT token |
| TOKEN_EXPIRED | JWT token has expired |
| TOKEN_REVOKED | Refresh token has been revoked |
| RATE_LIMIT_EXCEEDED | Too many login attempts |
| INVALID_RESET_TOKEN | Invalid password reset token |
| TOKEN_ALREADY_USED | Password reset token already used |
| FORBIDDEN | Insufficient permissions |

### Validation Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ],
    "timestamp": "2025-11-12T00:00:00.000Z",
    "path": "/api/auth/register"
  }
}
```

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test123!","gdprConsent":true}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Access Protected Route
```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📚 Documentation

- Full API docs: `src/modules/auth/README.md`
- Setup guide: `SETUP.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Requirements: `.kiro/specs/plataforma-ead/requirements.md`
- Design: `.kiro/specs/plataforma-ead/design.md`

## 🐛 Troubleshooting

### Database connection fails
```bash
# Check PostgreSQL is running
docker-compose up -d db

# Verify connection
psql -h localhost -U user -d plataforma_ead
```

### Redis connection fails
```bash
# Check Redis is running
docker-compose up -d redis

# Verify connection
redis-cli ping
```

### Port already in use
```bash
# Change PORT in .env
PORT=3001
```

## 🎯 Next Steps

1. Test all endpoints
2. Implement user management module (Task 3)
3. Implement courses module (Task 4)
4. Set up email service for password reset
5. Configure production environment
