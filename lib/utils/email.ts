import { Resend } from 'resend';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

// Initialize Resend with error handling
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required but not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const fromEmail = options.from || process.env.EMAIL_FROM || 'noreply@labsync.app';
    
    if (!fromEmail) {
      throw new Error('EMAIL_FROM environment variable or from parameter is required');
    }

    const client = getResendClient();
    
    await client.emails.send({
      from: fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html || '',
    });

    console.log(`✅ Email sent successfully to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
  } catch (error) {
    const errorMsg = `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Send a deadline reminder email
 */
export async function sendDeadlineReminder(
  to: string,
  deadlines: Array<{
    title: string;
    dueDate: Date;
    project?: { name: string } | null;
  }>,
  isUrgent: boolean = false
): Promise<void> {
  const subject = isUrgent 
    ? `🚨 Urgent: ${deadlines.length} deadline${deadlines.length > 1 ? 's' : ''} due soon`
    : `📅 Deadline reminder: ${deadlines.length} item${deadlines.length > 1 ? 's' : ''} coming up`;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const deadlineList = deadlines
    .map(d => {
      const projectText = d.project ? ` (${d.project.name})` : '';
      return `• ${d.title}${projectText} - Due ${formatDate(d.dueDate)}`;
    })
    .join('\n');

  const text = `
Hello,

${isUrgent ? '🚨 URGENT REMINDER' : 'This is a friendly reminder about your upcoming deadlines:'}

${deadlineList}

Please review these deadlines and take any necessary action.

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}

Best regards,
LabSync Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${isUrgent ? '#fef2f2' : '#f9fafb'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${isUrgent ? '#ef4444' : '#3b82f6'};">
    <h2 style="color: ${isUrgent ? '#dc2626' : '#1f2937'}; margin-top: 0;">
      ${isUrgent ? '🚨 Urgent Deadline Reminder' : '📅 Deadline Reminder'}
    </h2>
    
    <p>Hello,</p>
    
    <p>${isUrgent ? 'You have urgent deadlines that need immediate attention:' : 'This is a friendly reminder about your upcoming deadlines:'}</p>
    
    <ul style="background: white; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb;">
      ${deadlines
        .map(d => {
          const projectText = d.project ? ` <span style="color: #6b7280;">(${d.project.name})</span>` : '';
          return `<li style="margin: 8px 0;"><strong>${d.title}</strong>${projectText}<br><span style="color: #059669;">Due: ${formatDate(d.dueDate)}</span></li>`;
        })
        .join('')}
    </ul>
    
    <p>Please review these deadlines and take any necessary action.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}" 
         style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Visit Dashboard
      </a>
    </div>
    
    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
      Best regards,<br>
      LabSync Team
    </p>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
}