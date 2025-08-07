# Email Integration Guide

## Overview

The LabSync Research Platform includes a powerful email integration feature that allows users to send standup meeting notes to team members with a single click. The integration uses Resend for reliable email delivery and React Email for beautiful, responsive email templates.

## Features

- **One-click sending**: Send meeting notes to all participants with a single button click
- **Smart recipient selection**: Auto-populate recipients based on standup participants
- **Beautiful email templates**: Professional, mobile-responsive emails using React Email
- **Email preview**: See exactly what recipients will receive before sending
- **Rate limiting**: Prevents spam by limiting emails to once per hour per standup
- **Email history**: Track all sent emails with full audit trail
- **Flexible recipient management**: Add external recipients or remove participants as needed

## Setup

### 1. Get a Resend API Key

1. Sign up for a free account at [https://resend.com](https://resend.com)
2. Navigate to API Keys in your dashboard
3. Create a new API key
4. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Email Service (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="meetings@yourdomain.com"

# Application URL (for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Verify Domain (Production)

For production use, you'll need to verify your domain in Resend:

1. Go to Domains in your Resend dashboard
2. Add your domain
3. Add the DNS records provided by Resend
4. Wait for verification (usually takes a few minutes)

## Usage

### Sending Meeting Notes

1. Navigate to the Standups page
2. Select a completed standup from the history
3. Click the "Send Meeting Notes" button in the top-right
4. Review and modify recipients as needed
5. Preview the email
6. Click "Send Email"

### Email Content

The email includes:

- **Meeting metadata**: Date, lab name, duration
- **Participants**: List of all attendees
- **Summary**: Brief overview of the discussion (if available)
- **Action items**: Tasks with assignees and due dates
- **Blockers**: Issues that need resolution
- **Key decisions**: Important decisions made during the standup
- **Transcript link**: Direct link to view the full transcript

## API Reference

### Send Email Endpoint

```
POST /api/standups/[standupId]/send-email
```

**Request Body:**
```json
{
  "recipients": [
    { "email": "user@example.com", "name": "User Name" }
  ],
  "subject": "Optional custom subject",
  "senderName": "Jane Cooper",
  "senderEmail": "jane@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emailId": "resend_email_id",
    "logId": "email_log_id"
  },
  "message": "Email sent successfully to 3 recipient(s)"
}
```

### Get Email History

```
GET /api/standups/[standupId]/send-email
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [...],
    "suggestedRecipients": [...],
    "canSend": true,
    "lastSentAt": "2025-01-05T..."
  }
}
```

## Email Template Customization

The email template is built using React Email components and can be customized in `/emails/standup-meeting-notes.tsx`.

### Example Customization

```tsx
// Add a custom footer
<Text className="text-center text-[12px] text-gray-500">
  This email was sent by {senderName} from {labName}
  <br />
  Powered by LabSync Research Platform
</Text>
```

## Security & Permissions

- **Rate Limiting**: Emails can only be sent once per hour per standup
- **Permission Check**: Only standup participants and lab admins can send emails
- **Email Validation**: All recipient emails are validated before sending
- **Audit Trail**: All sent emails are logged with sender information

## Troubleshooting

### Common Issues

1. **"Email was recently sent" error**
   - Wait 1 hour before sending again
   - This prevents accidental spam

2. **"Failed to send email" error**
   - Check your Resend API key is valid
   - Ensure your domain is verified (for production)
   - Check the Resend dashboard for any issues

3. **Recipients not receiving emails**
   - Check spam/junk folders
   - Verify email addresses are correct
   - Ensure domain is properly configured with SPF/DKIM

### Debug Mode

To enable debug logging, set:

```env
DEBUG=resend,email
```

## Best Practices

1. **Test in Development**: Use Resend's test mode to avoid sending real emails
2. **Verify Recipients**: Always review the recipient list before sending
3. **Custom Subjects**: Use descriptive subjects that include the date
4. **Regular Cleanup**: The EmailLog table grows over time; consider periodic cleanup
5. **Monitor Deliverability**: Check Resend dashboard for bounce rates

## Future Enhancements

- Email scheduling for delayed sending
- Email templates library
- Recurring digest emails (weekly/monthly summaries)
- Calendar integration (meeting invites)
- Slack/Teams notifications as alternatives
- Email open/click tracking
- Unsubscribe management