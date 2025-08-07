import { Resend } from 'resend';
import { StandupMeetingNotesEmail } from '@/emails/standup-meeting-notes';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { z } from 'zod';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email validation schema
const EmailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const SendStandupNotesSchema = z.object({
  standupId: z.string(),
  recipients: z.array(EmailRecipientSchema).min(1),
  subject: z.string().optional(),
  includedTranscriptLink: z.boolean().default(true),
  senderName: z.string(),
  senderEmail: z.string().email(),
});

export type SendStandupNotesInput = z.infer<typeof SendStandupNotesSchema>;

interface EmailServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class EmailService {
  /**
   * Send standup meeting notes to recipients
   */
  static async sendStandupNotes(
    input: SendStandupNotesInput
  ): Promise<EmailServiceResult<{ emailId: string; logId: string }>> {
    try {
      // Validate input
      const validatedInput = SendStandupNotesSchema.parse(input);

      // Fetch standup data with all relations
      const standup = await prisma.standup.findUnique({
        where: { id: validatedInput.standupId },
        include: {
          lab: true,
          participants: {
            include: {
              user: true,
            },
          },
          actionItems: {
            include: {
              assignee: true,
            },
          },
          blockers: true,
          decisions: true,
          transcriptArchive: true,
        },
      });

      if (!standup) {
        return {
          success: false,
          error: 'Standup not found',
        };
      }

      // Format data for email template
      const emailData = {
        labName: standup.lab.name,
        meetingDate: format(standup.date, 'MMMM d, yyyy'),
        participants: standup.participants.map(p => ({
          name: p.user.name || 'Unknown',
          initials: this.getInitials(p.user.name || 'U'),
        })),
        summary: standup.transcriptArchive?.transcript
          ? this.extractSummary(standup.transcriptArchive.transcript)
          : undefined,
        actionItems: standup.actionItems.map(item => ({
          id: item.id,
          description: item.description,
          assignee: item.assignee
            ? { name: item.assignee.name || 'Unknown' }
            : null,
          dueDate: item.dueDate
            ? format(item.dueDate, 'MMMM d, yyyy')
            : null,
          completed: item.completed,
        })),
        blockers: standup.blockers.map(blocker => ({
          id: blocker.id,
          description: blocker.description,
          resolved: blocker.resolved,
        })),
        decisions: standup.decisions.map(decision => ({
          id: decision.id,
          description: decision.description,
        })),
        transcriptUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://labsync.com'}/standups/${standup.id}`,
        senderName: validatedInput.senderName,
      };

      // Prepare subject line
      const subject =
        validatedInput.subject ||
        `Standup Meeting Notes - ${standup.lab.name} - ${format(standup.date, 'MMM d')}`;

      // Send email
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'meetings@labsync.com',
        to: validatedInput.recipients.map(r => r.email),
        subject,
        react: StandupMeetingNotesEmail(emailData),
        replyTo: validatedInput.senderEmail,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Log email sent
      // TODO: Get actual user ID from auth context
      // For now, find user by email
      const sender = await prisma.user.findUnique({
        where: { email: validatedInput.senderEmail },
      });
      
      const emailLog = await prisma.emailLog.create({
        data: {
          standupId: standup.id,
          recipients: validatedInput.recipients.map(r => r.email),
          subject,
          sentById: sender?.id || 'system', // Use actual user ID or fallback
          status: 'SENT',
          metadata: {
            resendId: data?.id,
            senderName: validatedInput.senderName,
            senderEmail: validatedInput.senderEmail,
            includedSections: {
              actionItems: standup.actionItems.length > 0,
              blockers: standup.blockers.length > 0,
              decisions: standup.decisions.length > 0,
              transcript: validatedInput.includedTranscriptLink,
            },
          },
        },
      });

      return {
        success: true,
        data: {
          emailId: data?.id || '',
          logId: emailLog.id,
        },
      };
    } catch (error) {
      console.error('Send standup notes error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Get email history for a standup
   */
  static async getStandupEmailHistory(standupId: string) {
    try {
      const emails = await prisma.emailLog.findMany({
        where: { standupId },
        include: {
          sentBy: true,
        },
        orderBy: { sentAt: 'desc' },
      });

      return {
        success: true,
        data: emails,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch email history',
      };
    }
  }

  /**
   * Check if email was recently sent (within 24 hours)
   */
  static async wasRecentlySent(
    standupId: string,
    hours: number = 24
  ): Promise<boolean> {
    try {
      const recentEmail = await prisma.emailLog.findFirst({
        where: {
          standupId,
          status: 'SENT',
          sentAt: {
            gte: new Date(Date.now() - hours * 60 * 60 * 1000),
          },
        },
      });

      return !!recentEmail;
    } catch (error) {
      console.error('Check recent email error:', error);
      return false;
    }
  }

  /**
   * Validate email recipients
   */
  static validateRecipients(recipients: string[]): {
    valid: string[];
    invalid: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];

    recipients.forEach(email => {
      const result = z.string().email().safeParse(email);
      if (result.success) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    });

    return { valid, invalid };
  }

  /**
   * Get suggested recipients based on standup participants
   */
  static async getSuggestedRecipients(standupId: string) {
    try {
      const standup = await prisma.standup.findUnique({
        where: { id: standupId },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          lab: {
            include: {
              members: {
                where: {
                  OR: [
                    { isAdmin: true },
                    {
                      user: {
                        role: {
                          in: ['PRINCIPAL_INVESTIGATOR', 'CO_PRINCIPAL_INVESTIGATOR', 'LAB_ADMINISTRATOR'],
                        },
                      },
                    },
                  ],
                },
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!standup) {
        return [];
      }

      const recipients = new Map<string, { email: string; name: string }>();

      // Add participants
      if ('participants' in standup && Array.isArray(standup.participants)) {
        standup.participants.forEach((p: any) => {
          if (p.user?.email) {
            recipients.set(p.user.email, {
              email: p.user.email,
              name: p.user.name || 'Unknown',
            });
          }
        });
      }

      // Add lab leadership
      const standupWithLab = standup as any;
      if (standupWithLab.lab?.members && Array.isArray(standupWithLab.lab.members)) {
        standupWithLab.lab.members.forEach((m: any) => {
          if (m.user?.email) {
            recipients.set(m.user.email, {
              email: m.user.email,
              name: m.user.name || 'Unknown',
            });
          }
        });
      }

      return Array.from(recipients.values());
    } catch (error) {
      console.error('Get suggested recipients error:', error);
      return [];
    }
  }

  /**
   * Helper: Get initials from name
   */
  private static getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Helper: Extract summary from transcript (first 2-3 sentences)
   */
  private static extractSummary(transcript: string, maxLength: number = 200): string {
    const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [];
    let summary = '';
    
    for (const sentence of sentences) {
      if (summary.length + sentence.length > maxLength && summary.length > 0) {
        break;
      }
      summary += sentence.trim() + ' ';
    }
    
    return summary.trim() || transcript.substring(0, maxLength) + '...';
  }
}

export default EmailService;