import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

const BASE_URL = 'http://localhost:3000';

async function testStandupAPI() {
  console.log('\n🎙️ Testing Standup API Flow...\n');

  try {
    // 1. Test creating a standup
    console.log('1️⃣ Creating a new standup...');
    const createResponse = await fetch(`${BASE_URL}/api/standups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labId: 'default-lab',
        userId: 'test-user',
        participants: ['Test User'],
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create standup: ${createResponse.statusText}`);
    }

    const standup = await createResponse.json();
    console.log('   ✅ Standup created:', standup.id);

    // 2. Test adding a transcript (simulate)
    console.log('\n2️⃣ Simulating transcript...');
    const testTranscript = {
      audioUrl: 'test-audio.mp3',
      transcript: `
        Today I worked on implementing the new feature for data visualization.
        I completed the initial setup and created the basic components.
        
        My main blocker is that I need access to the production database.
        Also waiting for design approval on the UI mockups.
        
        Tomorrow I plan to continue working on the visualization components,
        write unit tests for the new features, and review pull requests.
      `,
      segments: [
        {
          startTime: 0,
          endTime: 30,
          text: 'Today I worked on implementing the new feature...',
          speaker: 'Test User'
        }
      ]
    };

    // 3. Test processing the standup
    console.log('\n3️⃣ Processing standup with AI...');
    const processResponse = await fetch(`${BASE_URL}/api/standups/${standup.id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: testTranscript.transcript,
      }),
    });

    if (!processResponse.ok) {
      const error = await processResponse.text();
      throw new Error(`Failed to process standup: ${error}`);
    }

    const analysis = await processResponse.json();
    console.log('   ✅ AI analysis completed');
    console.log('   📋 Summary:', analysis.summary?.substring(0, 100) + '...');
    console.log('   ✅ Action Items:', analysis.actionItems?.length || 0);
    console.log('   🚧 Blockers:', analysis.blockers?.length || 0);
    console.log('   📝 Updates:', analysis.updates?.length || 0);

    // 4. Test email sending
    console.log('\n4️⃣ Testing email notification...');
    const emailResponse = await fetch(`${BASE_URL}/api/standups/${standup.id}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [process.env.EMAIL_FROM || 'test@resend.dev'],
        includeTranscript: true,
        senderName: 'Test User',
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.log('   ❌ Email failed:', error);
    } else {
      const emailResult = await emailResponse.json();
      console.log('   ✅ Email sent successfully');
      console.log('   📧 Check inbox:', process.env.EMAIL_FROM);
    }

    console.log('\n✅ Standup API test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Standup API test failed:', error);
    console.log('\n⚠️  Make sure the Next.js development server is running:');
    console.log('   npm run dev');
  }
}

// Run the test
console.log('🚀 Starting API test...');
console.log('   Make sure your dev server is running on http://localhost:3000');
console.log('   Press Ctrl+C to cancel\n');

setTimeout(() => {
  testStandupAPI().catch(console.error);
}, 2000);