import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/utils/email';
import { addDays, format, isAfter, isBefore } from 'date-fns';

/**
 * Daily reminder cron job
 * This endpoint is triggered by Vercel cron to send daily deadline reminders
 * 
 * Expected to run daily at 9:00 AM UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🕐 Starting daily reminder cron job...');

    // Get today's date and upcoming dates for reminders
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    // Find deadlines that need reminders
    const upcomingDeadlines = await prisma.deadline.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: nextWeek,
        },
        status: {
          not: 'COMPLETED',
        },
        // Check if reminder should be sent based on reminderDays
        OR: [
          {
            // Due today
            dueDate: {
              gte: today,
              lt: tomorrow,
            },
          },
          {
            // Due tomorrow and has 1-day reminder
            dueDate: {
              gte: tomorrow,
              lt: addDays(tomorrow, 1),
            },
            reminderDays: {
              has: 1,
            },
          },
          {
            // Due in 3 days and has 3-day reminder
            dueDate: {
              gte: addDays(today, 3),
              lt: addDays(today, 4),
            },
            reminderDays: {
              has: 3,
            },
          },
          {
            // Due in 7 days and has 7-day reminder
            dueDate: {
              gte: nextWeek,
              lt: addDays(nextWeek, 1),
            },
            reminderDays: {
              has: 7,
            },
          },
        ],
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    console.log(`📋 Found ${upcomingDeadlines.length} deadlines needing reminders`);

    let emailsSent = 0;
    const errors: string[] = [];

    // Group deadlines by assignee for batched emails
    const deadlinesByAssignee = new Map<string, typeof upcomingDeadlines>();

    for (const deadline of upcomingDeadlines) {
      // Add to creator's list
      const creatorEmail = deadline.createdBy?.email;
      if (creatorEmail) {
        if (!deadlinesByAssignee.has(creatorEmail)) {
          deadlinesByAssignee.set(creatorEmail, []);
        }
        deadlinesByAssignee.get(creatorEmail)!.push(deadline);
      }

      // Add to assignees' lists
      for (const assignee of deadline.assignees) {
        const assigneeEmail = assignee.user.email;
        if (assigneeEmail) {
          if (!deadlinesByAssignee.has(assigneeEmail)) {
            deadlinesByAssignee.set(assigneeEmail, []);
          }
          deadlinesByAssignee.get(assigneeEmail)!.push(deadline);
        }
      }
    }

    // Send emails to each person
    for (const [email, userDeadlines] of deadlinesByAssignee) {
      try {
        // Remove duplicates
        const uniqueDeadlines = userDeadlines.filter(
          (deadline, index, self) =>
            index === self.findIndex(d => d.id === deadline.id)
        );

        // Categorize deadlines
        const dueToday = uniqueDeadlines.filter(d => 
          isBefore(d.dueDate, tomorrow) && !isBefore(d.dueDate, today)
        );
        const dueSoon = uniqueDeadlines.filter(d => 
          isAfter(d.dueDate, today) && isBefore(d.dueDate, nextWeek)
        );

        // Generate email content
        const subject = dueToday.length > 0 
          ? `🚨 ${dueToday.length} deadline${dueToday.length > 1 ? 's' : ''} due today`
          : `📅 Upcoming deadline${dueSoon.length > 1 ? 's' : ''} reminder`;

        const formatDeadlineList = (deadlines: typeof uniqueDeadlines) => {
          return deadlines.map(d => {
            const dueText = format(d.dueDate, 'MMM d, yyyy');
            const projectText = d.project ? ` (${d.project.name})` : '';
            return `• ${d.title}${projectText} - Due ${dueText}`;
          }).join('\n');
        };

        let emailContent = `Hello,\n\nThis is your daily deadline reminder:\n\n`;

        if (dueToday.length > 0) {
          emailContent += `🚨 DUE TODAY:\n${formatDeadlineList(dueToday)}\n\n`;
        }

        if (dueSoon.length > 0) {
          emailContent += `📅 COMING UP:\n${formatDeadlineList(dueSoon)}\n\n`;
        }

        emailContent += `Visit your dashboard to manage these deadlines: ${process.env.NEXT_PUBLIC_APP_URL}\n\n`;
        emailContent += `Best regards,\nLabManage Research Hub`;

        await sendEmail({
          to: email,
          subject,
          text: emailContent,
        });

        emailsSent++;
        console.log(`✅ Sent reminder to ${email} for ${uniqueDeadlines.length} deadlines`);
      } catch (error) {
        const errorMsg = `Failed to send email to ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Log completion
    console.log(`✅ Daily reminder cron job completed: ${emailsSent} emails sent, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: `Daily reminders sent successfully`,
      stats: {
        deadlinesFound: upcomingDeadlines.length,
        emailsSent,
        errorsCount: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Daily reminder cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for testing
export async function POST(request: NextRequest) {
  console.log('🧪 Manual trigger of daily reminder cron job');
  return GET(request);
}