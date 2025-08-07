import { config } from 'dotenv';
import { resolve } from 'path';
import { Resend } from 'resend';
import { StandupMeetingNotesEmail } from '../emails/standup-meeting-notes';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

async function testEmailTemplate() {
  console.log('\n📧 Testing Email Template...\n');

  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'test@resend.dev';
  
  if (!apiKey || apiKey.startsWith('re_xxxxxxxxx')) {
    console.error('❌ Resend API key not configured');
    return;
  }

  try {
    const resend = new Resend(apiKey);
    
    // Test data
    const testData = {
      labName: 'LabManage Test Lab',
      meetingDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      participants: [
        { name: 'Dr. John Smith', initials: 'JS' },
        { name: 'Dr. Sarah Johnson', initials: 'SJ' },
        { name: 'Mike Chen', initials: 'MC' },
      ],
      actionItems: [
        {
          id: '1',
          description: 'Complete statistical analysis for diabetes study',
          assignee: { name: 'Dr. John Smith' },
          completed: false,
        },
        {
          id: '2',
          description: 'Review and approve IRB protocol amendments',
          assignee: { name: 'Dr. Sarah Johnson' },
          completed: false,
        },
        {
          id: '3',
          description: 'Prepare presentation for next week\'s conference',
          assignee: { name: 'Mike Chen' },
          completed: false,
        },
      ],
      blockers: [
        {
          id: '1',
          description: 'Waiting for IRB approval for second cohort data access',
          resolved: false,
        },
        {
          id: '2',
          description: 'Need biostatistician review of analysis methodology',
          resolved: false,
        },
      ],
      decisions: [
        {
          id: '1',
          description: 'Proceed with interim analysis of first cohort',
        },
        {
          id: '2',
          description: 'Schedule follow-up meeting with biostatistics team',
        },
      ],
      updates: [
        'Completed first cohort statistical analysis',
        'Found correlations between medication adherence and patient outcomes',
        'Started drafting methods section for publication',
      ],
      summary: 'The team made good progress on the diabetes study analysis. Key findings on medication adherence were identified, though access to second cohort data remains blocked pending IRB approval.',
      transcriptUrl: 'https://labmanage.com/standups/test-transcript',
      senderName: 'LabManage System',
    };

    console.log('📨 Sending test email...');
    console.log('   To:', emailFrom);
    console.log('   From:', emailFrom);
    
    const result = await resend.emails.send({
      from: emailFrom,
      to: emailFrom,
      subject: `Test: ${testData.labName} - Standup Meeting Notes`,
      react: StandupMeetingNotesEmail(testData),
    });

    if (result.data) {
      console.log('\n✅ Email sent successfully!');
      console.log('   Email ID:', result.data.id);
      console.log('   Check your inbox at:', emailFrom);
      console.log('\n📋 Email Preview:');
      console.log('   Subject: Test: LabManage Test Lab - Standup Meeting Notes');
      console.log('   Contains:');
      console.log('   - Meeting summary');
      console.log('   - 3 action items');
      console.log('   - 2 blockers');
      console.log('   - 3 updates');
      console.log('   - Link to full transcript');
    } else if (result.error) {
      console.error('❌ Email failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
    }
  }
}

// Run the test
testEmailTemplate().catch(console.error);