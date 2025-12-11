# PIX Email Notification Flow

## Complete User Journey with Email Notifications

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PIX PAYMENT LIFECYCLE                            │
│                     with Email Notifications                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Student Initiates Payment                                        │
└──────────────────────────────────────────────────────────────────────────┘

    Student clicks "Pay with PIX"
           ↓
    Frontend sends POST /api/payments/checkout
           ↓
    Backend: PaymentController.createCheckout()
           ↓
    Backend: PixPaymentService.createPixPayment()
           ↓
    ┌─────────────────────────────────────────┐
    │ 1. Calculate discount (10%)             │
    │ 2. Create Stripe PaymentIntent          │
    │ 3. Extract QR Code                      │
    │ 4. Save to pix_payments table           │
    │ 5. Fetch student & plan details         │
    │ 6. 📧 SEND PENDING EMAIL                │
    └─────────────────────────────────────────┘
           ↓
    Return QR Code to frontend
           ↓
    Student sees QR Code + receives email

┌──────────────────────────────────────────────────────────────────────────┐
│ 📧 EMAIL 1: PIX Payment Pending                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Subject: Pagamento PIX Gerado - Plataforma EAD                           │
│                                                                           │
│ Content:                                                                  │
│ • Payment details (plan, amount, discount)                               │
│ • Final amount highlighted in green                                      │
│ • PIX code (copia e cola) in monospace                                   │
│ • Expiration warning (30 minutes)                                        │
│ • Step-by-step payment instructions                                      │
│ • Link to check payment status                                           │
│                                                                           │
│ Requirements: 6.4                                                         │
└──────────────────────────────────────────────────────────────────────────┘

           ↓
    Student opens banking app
           ↓
    Student scans QR Code or pastes code
           ↓
    Student confirms payment in bank

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2A: Payment Confirmed (Happy Path)                                  │
└──────────────────────────────────────────────────────────────────────────┘

    Bank confirms payment to Stripe
           ↓
    Stripe sends webhook: payment_intent.succeeded
           ↓
    Backend: WebhookController receives webhook
           ↓
    Backend: WebhookHandlerService.handlePixPaymentSucceeded()
           ↓
    ┌─────────────────────────────────────────┐
    │ 1. Verify webhook signature             │
    │ 2. Find PIX payment in database         │
    │ 3. Update status to 'paid'              │
    │ 4. Create/update subscription           │
    │ 5. Activate student subscription        │
    │ 6. Create payment record                │
    │ 7. Fetch student & plan details         │
    │ 8. 📧 SEND CONFIRMED EMAIL              │
    └─────────────────────────────────────────┘
           ↓
    Frontend polling detects status change
           ↓
    Frontend redirects to success page
           ↓
    Student receives confirmation email

┌──────────────────────────────────────────────────────────────────────────┐
│ 📧 EMAIL 2: PIX Payment Confirmed                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ Subject: Pagamento PIX Confirmado! 🎉 - Plataforma EAD                   │
│                                                                           │
│ Content:                                                                  │
│ • Celebration message                                                     │
│ • Subscription activation confirmation                                   │
│ • Plan details and amount paid                                           │
│ • Subscription expiration date                                           │
│ • "Explore Courses" button                                               │
│ • Benefits reminder                                                       │
│                                                                           │
│ Requirements: 6.2                                                         │
└──────────────────────────────────────────────────────────────────────────┘

           ↓
    Student has active subscription
           ↓
    Student can access all courses

┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2B: Payment Expires (Alternative Path)                              │
└──────────────────────────────────────────────────────────────────────────┘

    30 minutes pass without payment
           ↓
    Cron job runs every 5 minutes
           ↓
    Backend: PixPaymentService.expirePendingPayments()
           ↓
    ┌─────────────────────────────────────────┐
    │ 1. Find payments with expires_at < now  │
    │ 2. Cancel PaymentIntent in Stripe       │
    │ 3. Update status to 'expired'           │
    │ 4. Fetch student & plan details         │
    │ 5. 📧 SEND EXPIRED EMAIL                │
    └─────────────────────────────────────────┘
           ↓
    Student receives expiration email

┌──────────────────────────────────────────────────────────────────────────┐
│ 📧 EMAIL 3: PIX Payment Expired                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Subject: Pagamento PIX Expirado - Plataforma EAD                         │
│                                                                           │
│ Content:                                                                  │
│ • Expiration notice                                                       │
│ • Explanation of what happened                                           │
│ • Reassurance message                                                     │
│ • "Generate New Payment" button                                          │
│ • Reminder about PIX validity (30 min)                                   │
│ • Discount still available message                                       │
│                                                                           │
│ Requirements: 6.3                                                         │
└──────────────────────────────────────────────────────────────────────────┘

           ↓
    Student clicks "Generate New Payment"
           ↓
    Returns to STEP 1 (new payment cycle)
```

## Email Timing Summary

| Email Type | Trigger | Timing | Purpose |
|------------|---------|--------|---------|
| **Pending** | QR Code generated | Immediate | Provide payment details and instructions |
| **Confirmed** | Webhook received | Within seconds of payment | Confirm subscription activation |
| **Expired** | Payment expires | After 30 minutes | Encourage retry with new payment |

## Technical Implementation Details

### 1. Pending Email
```typescript
// Location: pix-payment.service.ts -> createPixPayment()
await notificationService.sendPixPaymentPendingEmail({
  studentName: student.name,
  studentEmail: student.email,
  planName: plan.name,
  amount: originalAmount,
  discount: calculatedDiscount,
  finalAmount: amountAfterDiscount,
  copyPasteCode: qrCode,
  expiresAt: expirationDate,
  paymentId: paymentId,
});
```

### 2. Confirmed Email
```typescript
// Location: webhook-handler.service.ts -> handlePixPaymentSucceeded()
await notificationService.sendPixPaymentConfirmedEmail({
  studentName: student.name,
  studentEmail: student.email,
  planName: plan.name,
  finalAmount: paidAmount,
  expiresAt: subscriptionExpirationDate,
});
```

### 3. Expired Email
```typescript
// Location: pix-payment.service.ts -> expirePendingPayments()
await notificationService.sendPixPaymentExpiredEmail({
  studentName: student.name,
  studentEmail: student.email,
  planName: plan.name,
  planId: plan.id,
});
```

## Error Handling Strategy

All email operations follow this pattern:

```typescript
try {
  await notificationService.sendEmail(...);
  logger.info('Email sent successfully');
} catch (emailError) {
  // Log error but don't fail the main operation
  logger.error('Failed to send email', { error: emailError });
}
```

**Why?**
- Email failures shouldn't block payment processing
- User experience is not affected by email issues
- Errors are logged for monitoring and debugging
- Operations remain idempotent

## Database State Transitions

```
PIX Payment Status Flow:

pending → paid (via webhook)
   ↓
expired (via cron job)

Subscription Status Flow:

pending/expired → active (when payment confirmed)
```

## Frontend Integration

The frontend polls for payment status:

```typescript
// Polling every 3 seconds
const checkStatus = async () => {
  const response = await api.get(`/payments/pix/${paymentId}/status`);
  
  if (response.data.status === 'paid') {
    // Redirect to success page
    // User also receives email
  }
  
  if (response.data.status === 'expired') {
    // Show expired message
    // User also receives email
  }
};
```

## Monitoring and Observability

All email operations are logged:

```
INFO: PIX payment created successfully
INFO: PIX payment pending email sent
INFO: PIX payment status updated to paid
INFO: PIX payment confirmed email sent
INFO: PIX payment expired
INFO: PIX payment expired email sent
```

## Testing Checklist

- [ ] Create PIX payment → Check pending email received
- [ ] Confirm payment via webhook → Check confirmed email received
- [ ] Wait 30 minutes → Check expired email received
- [ ] Verify email content is correct (amounts, dates, links)
- [ ] Test email on mobile and desktop
- [ ] Verify links in emails work correctly
- [ ] Test with different plans and amounts
- [ ] Verify error handling (email service down)

## Requirements Validation

✅ **Requirement 6.2**: Email sent when payment is confirmed
- Implemented in webhook handler
- Includes subscription activation details
- Sent asynchronously after payment processing

✅ **Requirement 6.3**: Email sent when payment expires
- Implemented in expiration job
- Includes link to generate new payment
- Sent for each expired payment

✅ **Requirement 6.4**: Email sent with payment details
- Implemented in payment creation
- Includes QR code, expiration time, and status link
- Sent immediately after QR code generation

## Future Enhancements

1. **Email Preferences**
   - Allow users to opt-in/opt-out of notifications
   - Choose notification channels (email, SMS, push)

2. **Internationalization**
   - Support multiple languages
   - Detect user language preference

3. **Analytics**
   - Track email open rates
   - Track link click rates
   - A/B test email content

4. **Rich Content**
   - Include QR code image in email
   - Add promotional content
   - Personalized course recommendations

5. **SMS Notifications**
   - Send SMS for critical events
   - Shorter, more urgent messages
   - Better for time-sensitive notifications
