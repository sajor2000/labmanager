import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before importing anything else
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

// Set DATABASE_URL from POSTGRES_URL if not set
if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL;
}

// Now import after env vars are loaded
import { StandupService } from '../lib/services/standup.service';
import { EmailService } from '../lib/services/email.service';
import { prisma } from '../lib/prisma';

async function testStandupFlow() {
  console.log('\n🎙️ Testing Complete Standup Flow...\n');

  try {
    // 1. Get or create test lab
    console.log('1️⃣ Setting up test lab...');
    let testLab = await prisma.lab.findFirst({
      where: { shortName: 'TEST' }
    });

    if (!testLab) {
      testLab = await prisma.lab.create({
        data: {
          name: 'Test Lab',
          shortName: 'TEST',
          description: 'Lab for testing standup flow',
          isActive: true,
        }
      });
      console.log('   ✅ Created test lab');
    } else {
      console.log('   ✅ Using existing test lab');
    }

    // 2. Get or create test user
    console.log('\n2️⃣ Setting up test user...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@labmanage.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@labmanage.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          initials: 'TU',
          role: 'RESEARCH_MEMBER',
          isActive: true,
        }
      });
      console.log('   ✅ Created test user');
    } else {
      console.log('   ✅ Using existing test user');
    }

    // 3. Create a test standup
    console.log('\n3️⃣ Creating test standup...');
    const standup = await StandupService.createStandup({
      labId: testLab.id,
      participantIds: [testUser.id],
    });
    console.log('   ✅ Standup created:', standup.id);

    // 4. Add test transcript
    console.log('\n4️⃣ Adding test transcript...');
    const testTranscript = `
      Today I worked on implementing the new feature for data visualization.
      I completed the initial setup and created the basic components.
      
      My main blocker is that I need access to the production database to test with real data.
      Also waiting for design approval on the UI mockups.
      
      Tomorrow I plan to:
      - Continue working on the visualization components
      - Write unit tests for the new features
      - Review the pull request from Sarah
      - Attend the team meeting at 2 PM
    `;

    await prisma.transcriptArchive.create({
      data: {
        standupId: standup.id,
        transcript: testTranscript,
        duration: 30,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });
    console.log('   ✅ Transcript added');

    // 5. Process the standup with AI (using OpenAIService directly)
    console.log('\n5️⃣ Processing standup with AI...');
    let analysisResult: any = null;
    try {
      const { OpenAIService } = await import('../lib/services/openai.service');
      analysisResult = await OpenAIService.analyzeTranscript(testTranscript);
      
      if (analysisResult.success && analysisResult.data) {
        console.log('   ✅ AI analysis completed');
        console.log('   📋 Summary:', analysisResult.data.summary?.substring(0, 100) + '...');
        console.log('   ✅ Action Items:', analysisResult.data.actionItems?.length || 0);
        console.log('   🚧 Blockers:', analysisResult.data.blockers?.length || 0);
        console.log('   📝 Decisions:', analysisResult.data.decisions?.length || 0);
        
        // Save the analysis results to the standup
        if (analysisResult.data.actionItems) {
          for (const item of analysisResult.data.actionItems) {
            await prisma.actionItem.create({
              data: {
                standupId: standup.id,
                description: item.description,
                assigneeId: testUser.id,
              }
            });
          }
        }
        
        if (analysisResult.data.blockers) {
          for (const blocker of analysisResult.data.blockers) {
            await prisma.blocker.create({
              data: {
                standupId: standup.id,
                description: blocker.description,
                resolved: false,
              }
            });
          }
        }
      } else {
        console.log('   ❌ AI analysis failed');
      }
    } catch (error) {
      console.log('   ❌ AI analysis error:', error);
    }

    // 6. Test email sending
    console.log('\n6️⃣ Testing email notification...');
    const emailRecipients = [
      { 
        email: process.env.EMAIL_FROM || 'test@resend.dev',
        name: testUser.name 
      }
    ];
    
    try {
      const emailResult = await EmailService.sendStandupNotes({
        standupId: standup.id,
        recipients: emailRecipients,
        senderName: testUser.name,
        senderEmail: testUser.email,
        includedTranscriptLink: true,
      });

      if (emailResult.success) {
        console.log('   ✅ Email sent successfully');
        console.log('   📧 Check inbox:', emailRecipients[0].email);
      } else {
        console.log('   ❌ Email failed:', emailResult.error);
      }
    } catch (error) {
      console.log('   ❌ Email error:', error);
    }

    // 7. Cleanup (optional)
    console.log('\n7️⃣ Cleaning up test data...');
    await prisma.standup.delete({ where: { id: standup.id } });
    console.log('   ✅ Test standup deleted');

    console.log('\n✅ Standup flow test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Standup flow test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStandupFlow().catch(console.error);