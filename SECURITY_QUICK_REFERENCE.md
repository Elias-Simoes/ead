# Security & LGPD Quick Reference Guide

## Security Features Overview

### 1. Security Headers
All API responses include security headers automatically:
- **HSTS**: Forces HTTPS connections
- **CSP**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing

### 2. Rate Limiting
- **Global**: 100 requests/minute per IP
- **Login**: 5 attempts per 15 minutes per IP
- Returns `429 Too Many Requests` when exceeded

### 3. CSRF Protection
- Required for POST, PUT, PATCH, DELETE requests
- Get token: `GET /api/csrf-token` (requires authentication)
- Include in header: `X-CSRF-Token: <token>`

### 4. Audit Logging
Automatically logs critical actions:
- User login/logout
- User creation/suspension
- Password changes
- Course approvals
- GDPR requests

## LGPD/GDPR Endpoints

### Get User Data
```bash
GET /api/gdpr/my-data
Authorization: Bearer <token>
```

Returns all user data including:
- Profile information
- Course progress
- Certificates
- Subscriptions
- Payments
- Audit logs

### Request Account Deletion
```bash
POST /api/gdpr/delete-account
Authorization: Bearer <token>
```

- Schedules deletion for 15 days later
- User can cancel before scheduled date
- Data is anonymized, not completely deleted

### Cancel Deletion Request
```bash
POST /api/gdpr/cancel-deletion
Authorization: Bearer <token>
```

### Check Deletion Status
```bash
GET /api/gdpr/deletion-status
Authorization: Bearer <token>
```

## Frontend Integration

### Using CSRF Protection

```javascript
// 1. Get CSRF token after login
async function getCsrfToken(accessToken) {
  const response = await fetch('/api/csrf-token', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  return data.csrfToken;
}

// 2. Include token in state-changing requests
async function updateProfile(accessToken, csrfToken, data) {
  const response = await fetch('/api/students/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### Handling Rate Limits

```javascript
async function makeRequest(url, options) {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    // Wait and retry or show error to user
  }
  
  return response;
}
```

### GDPR Data Access

```javascript
async function downloadMyData(accessToken) {
  const response = await fetch('/api/gdpr/my-data', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  
  // Convert to JSON file for download
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-data.json';
  a.click();
}
```

### Account Deletion Flow

```javascript
async function requestAccountDeletion(accessToken) {
  const confirmed = confirm(
    'Are you sure you want to delete your account? ' +
    'This action will be completed in 15 days and can be cancelled before then.'
  );
  
  if (!confirmed) return;
  
  const response = await fetch('/api/gdpr/delete-account', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  
  alert(
    `Account deletion scheduled for ${new Date(data.data.scheduledFor).toLocaleDateString()}. ` +
    'You can cancel this request before the scheduled date.'
  );
}

async function cancelDeletion(accessToken) {
  const response = await fetch('/api/gdpr/cancel-deletion', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (response.ok) {
    alert('Account deletion cancelled successfully');
  }
}
```

## Testing

### Run Security Tests
```bash
node test-security.js
```

Tests include:
- Security headers verification
- Rate limiting
- CSRF protection
- GDPR endpoints
- Authentication security

### Manual Testing

#### Test Security Headers
```bash
curl -I http://localhost:3000/health
```

Look for headers:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`

#### Test Rate Limiting
```bash
# Make multiple rapid requests
for i in {1..110}; do
  curl http://localhost:3000/api/courses
done
```

Should see 429 responses after 100 requests.

#### Test CSRF Protection
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.tokens.accessToken')

CSRF=$(curl http://localhost:3000/api/csrf-token \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.csrfToken')

# Try without CSRF token (should fail)
curl -X PATCH http://localhost:3000/api/students/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'

# Try with CSRF token (should succeed)
curl -X PATCH http://localhost:3000/api/students/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'
```

## Monitoring

### Check Audit Logs
```sql
-- Recent audit logs
SELECT * FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 100;

-- Logs for specific user
SELECT * FROM audit_logs 
WHERE user_id = '<user-id>' 
ORDER BY timestamp DESC;

-- Failed login attempts
SELECT * FROM audit_logs 
WHERE action = 'LOGIN' 
  AND details->>'success' = 'false'
ORDER BY timestamp DESC;
```

### Check GDPR Requests
```sql
-- Pending deletion requests
SELECT u.email, gdr.* 
FROM gdpr_deletion_requests gdr
JOIN users u ON gdr.user_id = u.id
WHERE gdr.status = 'pending'
ORDER BY gdr.scheduled_for;

-- Completed deletions
SELECT * FROM gdpr_deletion_requests 
WHERE status = 'completed'
ORDER BY processed_at DESC;
```

### Monitor Rate Limiting
```bash
# Check Redis for rate limit keys
redis-cli KEYS "api:*"
redis-cli KEYS "login:*"

# Check specific IP
redis-cli GET "api:192.168.1.1"
```

## Troubleshooting

### CSRF Token Issues

**Problem**: Getting 403 CSRF_TOKEN_MISSING
**Solution**: Ensure you're getting a fresh token after login and including it in the `X-CSRF-Token` header.

**Problem**: Getting 403 CSRF_TOKEN_INVALID
**Solution**: Token may have expired (1 hour TTL). Get a new token.

### Rate Limiting Issues

**Problem**: Getting 429 too quickly
**Solution**: Check if multiple users are behind the same IP (NAT). Consider adjusting rate limits or using user-based rate limiting.

**Problem**: Rate limit not working
**Solution**: Ensure Redis is running and connected. Check Redis connection in logs.

### GDPR Issues

**Problem**: Deletion not processing
**Solution**: Check if cron job is running. Verify scheduled_for date has passed. Check logs for errors.

**Problem**: Data not fully anonymized
**Solution**: Review anonymization logic in `gdprService.anonymizeUserData()`. Some data is intentionally preserved for legal compliance.

## Security Checklist

- [ ] All endpoints use HTTPS in production
- [ ] Security headers are present on all responses
- [ ] Rate limiting is configured appropriately
- [ ] CSRF protection is enabled for state-changing operations
- [ ] Audit logging is capturing critical actions
- [ ] GDPR endpoints are accessible to users
- [ ] Deletion cron job is running
- [ ] Redis is properly configured and monitored
- [ ] Database backups include audit logs
- [ ] Security tests pass regularly

## Compliance Checklist

### LGPD/GDPR Requirements

- [x] **Right to Access** (Art. 15): `/api/gdpr/my-data`
- [x] **Right to Erasure** (Art. 17): `/api/gdpr/delete-account`
- [x] **Data Minimization** (Art. 5): Anonymization instead of deletion
- [x] **Audit Trail** (Art. 30): Comprehensive audit logging
- [x] **Consent** (Art. 7): Captured during registration
- [x] **Security** (Art. 32): Multiple security layers
- [x] **Breach Notification**: Audit logs enable detection

## Support

For security issues or questions:
1. Check this guide first
2. Review audit logs for suspicious activity
3. Check Redis and database connectivity
4. Review application logs
5. Run security test suite

## Updates

Last updated: 2025-11-12
Version: 1.0
