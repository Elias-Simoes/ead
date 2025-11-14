# Certificate Module - Quick Reference Guide

## Overview
The certificate module automatically generates and issues PDF certificates to students who complete courses and pass all assessments.

## How It Works

### Automatic Issuance
1. **Hourly Job**: A cron job runs every hour checking for eligible students
2. **Eligibility Check**: Students must have:
   - 100% course completion
   - Passed all assessments (score >= passing_score)
   - No existing certificate for that course
3. **PDF Generation**: Creates a professional certificate with QR code
4. **Storage**: Uploads PDF to cloud storage (S3/R2)
5. **Email**: Sends notification with download link

### Manual Issuance
Students can also manually request a certificate:
```bash
POST /api/certificates/issue/:courseId
Authorization: Bearer <student-token>
```

## API Endpoints

### 1. List Student Certificates
```http
GET /api/certificates
Authorization: Bearer <student-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cert-uuid",
      "studentName": "John Doe",
      "courseName": "Introduction to Programming",
      "courseWorkload": 40,
      "issuedAt": "2025-11-12T10:00:00Z",
      "verificationCode": "abc123...",
      "pdfUrl": "https://storage.../certificates/abc123.pdf"
    }
  ],
  "count": 1
}
```

### 2. Download Certificate
```http
GET /api/certificates/:id/download
Authorization: Bearer <student-token>
```

**Response:** Redirects to PDF URL

### 3. Verify Certificate (Public)
```http
GET /api/public/certificates/verify/:verificationCode
```

**No authentication required**

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificate": {
      "studentName": "John Doe",
      "courseName": "Introduction to Programming",
      "courseWorkload": 40,
      "issuedAt": "2025-11-12T10:00:00Z"
    }
  }
}
```

### 4. Manual Certificate Issuance
```http
POST /api/certificates/issue/:courseId
Authorization: Bearer <student-token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "cert-uuid",
    "verificationCode": "abc123...",
    "pdfUrl": "https://..."
  },
  "message": "Certificate issued successfully"
}
```

**Response (Not Eligible):**
```json
{
  "error": {
    "code": "COURSE_NOT_COMPLETED",
    "message": "You must complete 100% of the course to receive a certificate"
  }
}
```

## Certificate Template

The generated PDF includes:
- **Platform Logo/Name**: "Plataforma EAD"
- **Title**: "CERTIFICADO DE CONCLUSÃO DE CURSO"
- **Student Name**: In uppercase, prominent
- **Course Name**: Bold and centered
- **Workload**: "com carga horária de X horas"
- **Issue Date**: Brazilian format (DD/MM/YYYY)
- **QR Code**: Links to verification page
- **Verification Code**: First 8 characters displayed
- **Validation URL**: Full URL for manual verification

## Eligibility Rules

A student is eligible for a certificate when ALL conditions are met:

1. ✅ **Course Started**: Student has progress record
2. ✅ **100% Complete**: All lessons marked as completed
3. ✅ **Completion Date**: `completed_at` is set
4. ✅ **Assessments Passed**: All assessment scores >= passing_score
5. ✅ **No Duplicate**: No existing certificate for this course

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `COURSE_NOT_STARTED` | Student hasn't started the course | Start the course first |
| `COURSE_NOT_COMPLETED` | Progress < 100% | Complete all lessons |
| `ASSESSMENT_NOT_PASSED` | Score below passing threshold | Retake assessments |
| `CERTIFICATE_NOT_FOUND` | Invalid certificate ID or code | Check the ID/code |
| `FORBIDDEN` | Accessing another student's cert | Use your own credentials |

## Email Notification

When a certificate is issued, the student receives an email with:

**Subject:** `Certificado Emitido - [Course Name]`

**Content:**
- Congratulations message
- Course name
- Download button (CTA)
- Verification code
- Validation URL

## Testing

### Manual Test Flow

1. **Complete a course:**
   ```bash
   POST /api/courses/:courseId/progress
   Body: { "lessonId": "..." }
   ```

2. **Submit and pass assessment:**
   ```bash
   POST /api/assessments/:assessmentId/submit
   Body: { "answers": [...] }
   ```

3. **Request certificate:**
   ```bash
   POST /api/certificates/issue/:courseId
   ```

4. **Verify certificate:**
   ```bash
   GET /api/public/certificates/verify/:code
   ```

### Automated Test

Run the comprehensive test suite:
```bash
node test-certificates.js
```

## Configuration

### Environment Variables

Add to `.env`:
```env
FRONTEND_URL=http://localhost:5173
```

This URL is used for:
- QR code links
- Email download links
- Verification page links

### Storage Configuration

Certificates are stored in the `certificates/` folder:
```
certificates/
  ├── abc123-def456.pdf
  ├── xyz789-uvw012.pdf
  └── ...
```

Filename format: `{verificationCode}.pdf`

## Database Schema

```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  verification_code VARCHAR(100) UNIQUE,
  pdf_url VARCHAR(500),
  issued_at TIMESTAMP,
  UNIQUE(student_id, course_id)
);
```

## Cron Job

The certificate issuance job runs automatically:

**Schedule:** Every hour (`0 * * * *`)

**What it does:**
1. Queries for eligible students
2. Checks full eligibility (progress + assessments)
3. Generates and uploads PDF
4. Creates database record
5. Sends email notification

**Manual trigger:**
```typescript
import { issueCertificatesNow } from './modules/certificates/jobs/issue-certificates.job';

const result = await issueCertificatesNow();
console.log(`Issued ${result.issued} certificates`);
```

## Frontend Integration

### Display Certificate List
```javascript
const response = await fetch('/api/certificates', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();

// Display certificates
data.forEach(cert => {
  console.log(`${cert.courseName} - ${cert.issuedAt}`);
});
```

### Download Certificate
```javascript
// Option 1: Direct link
window.open(`/api/certificates/${certId}/download`);

// Option 2: Use PDF URL directly
window.open(cert.pdfUrl);
```

### Verify Certificate
```javascript
const response = await fetch(`/api/public/certificates/verify/${code}`);
const { data } = await response.json();

if (data.valid) {
  console.log('Certificate is valid!');
  console.log(`Student: ${data.certificate.studentName}`);
  console.log(`Course: ${data.certificate.courseName}`);
}
```

### QR Code Scanner
The QR code in the PDF contains:
```
https://your-frontend.com/certificates/verify/{verificationCode}
```

Create a verification page at this route to display certificate details.

## Security Considerations

1. **Verification Codes**: UUIDs provide sufficient entropy
2. **Ownership Check**: Downloads require authentication + ownership
3. **Public Verification**: Read-only, no sensitive data exposed
4. **Duplicate Prevention**: Database constraint ensures uniqueness
5. **PDF Storage**: Public URLs but unguessable filenames

## Performance

- **PDF Generation**: ~500ms per certificate
- **Storage Upload**: ~1-2s depending on network
- **Database Insert**: <100ms
- **Email Sending**: Async, doesn't block

For bulk issuance, the job processes students sequentially to avoid overwhelming external services.

## Troubleshooting

### Certificate Not Issued

**Check:**
1. Is course 100% complete? `SELECT progress_percentage FROM student_progress WHERE ...`
2. Are assessments passed? `SELECT score, passing_score FROM student_assessments ...`
3. Does certificate already exist? `SELECT * FROM certificates WHERE ...`

### PDF Generation Failed

**Common causes:**
- Storage service not configured
- Invalid course/student data
- Memory issues (large PDFs)

**Solution:**
- Check logs for specific error
- Verify storage credentials
- Ensure data integrity

### Email Not Received

**Check:**
- Email service configuration
- Student email address
- Spam folder
- Email service logs

## Best Practices

1. **Test in Development**: Use test data before production
2. **Monitor Job**: Check logs for job execution
3. **Storage Backup**: Ensure PDFs are backed up
4. **Email Templates**: Customize for your brand
5. **Verification Page**: Create user-friendly frontend
6. **Error Handling**: Log all failures for debugging

## Future Enhancements

Potential improvements:
- [ ] Multiple certificate templates
- [ ] Custom branding per course
- [ ] Digital signatures
- [ ] Blockchain verification
- [ ] Certificate revocation
- [ ] Batch download (ZIP)
- [ ] Social media sharing
- [ ] Certificate analytics

## Support

For issues or questions:
1. Check logs: `[timestamp] [level] message`
2. Review error codes above
3. Run test suite: `node test-certificates.js`
4. Check database state
5. Verify configuration

---

**Module Status:** ✅ Fully Implemented and Tested

**Last Updated:** November 12, 2025
