# Plataforma EAD - Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for running services)

## Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- Redis connection
- JWT secret (use a strong random string)
- Other service credentials

3. **Start PostgreSQL and Redis:**

Using Docker Compose:
```bash
docker-compose up -d db redis
```

Or install and run them locally.

4. **Run database migrations:**

```bash
npm run migrate
```

This will create all necessary tables including:
- users
- refresh_tokens
- password_reset_tokens
- students

5. **Start the development server:**

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env`).

## Default Admin User

After running migrations, a default admin user is created:

- **Email:** admin@plataforma-ead.com
- **Password:** Admin@123

**⚠️ IMPORTANT:** Change this password immediately in production!

## API Documentation

### Health Check
```bash
GET http://localhost:3000/health
```

### Authentication Endpoints

All authentication endpoints are under `/api/auth`:

- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

See `src/modules/auth/README.md` for detailed API documentation.

## Testing the API

### Register a new student:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "name": "John Doe",
    "password": "SecurePass123!",
    "gdprConsent": true
  }'
```

### Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123!"
  }'
```

### Access protected route:

```bash
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # PostgreSQL connection
│   ├── redis.ts      # Redis connection
│   └── env.ts        # Environment variables
├── modules/          # Feature modules
│   └── auth/         # Authentication module
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       └── validators/
├── shared/           # Shared utilities
│   ├── middleware/   # Express middleware
│   ├── types/        # TypeScript types
│   └── utils/        # Utility functions
└── server.ts         # Application entry point
```

## Security Notes

1. **JWT Secret:** Use a strong, random secret in production
2. **Database Credentials:** Never commit real credentials to version control
3. **HTTPS:** Always use HTTPS in production
4. **Rate Limiting:** Configured for login attempts (5 per 15 minutes)
5. **Password Requirements:** Minimum 8 characters with uppercase, lowercase, number, and special character

## Troubleshooting

### Database connection fails
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists

### Redis connection fails
- Check Redis is running
- Verify Redis URL in `.env`

### Port already in use
- Change PORT in `.env`
- Or stop the process using the port

## Next Steps

After setting up authentication, you can proceed with implementing:
- User management module (Task 3)
- Courses module (Task 4)
- Subscriptions and payments (Task 5)
- And other features as per the implementation plan

## Support

For issues or questions, refer to:
- Requirements: `.kiro/specs/plataforma-ead/requirements.md`
- Design: `.kiro/specs/plataforma-ead/design.md`
- Tasks: `.kiro/specs/plataforma-ead/tasks.md`
