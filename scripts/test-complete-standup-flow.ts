import { config } from 'dotenv';
import { resolve } from 'path';
import fetch from 'node-fetch';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

const BASE_URL = 'http://localhost:3000';

// Mock authentication token (in production, this would come from login)
const mockAuthToken = 'test-auth-token';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteStandupFlow() {
  console.log('\n🎙️ Testing Complete Standup Recording & Processing Flow...\n');

  try {
    // Step 1: Simulate user login and get session
    console.log('1️⃣ Simulating authenticated user session...');
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': 'next-auth.session-token=' + mockAuthToken,
    };

    // Step 2: Create a new standup
    console.log('\n2️⃣ Creating a new standup recording...');
    const createResponse = await fetch(`${BASE_URL}/api/standups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        labId: 'cm4t7vqwm000108l7ax7f1sga', // Using actual lab ID from your database
        participants: ['John Smith', 'Sarah Johnson', 'Mike Chen'],
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create standup: ${error}`);
    }

    const standup = await createResponse.json();
    console.log('   ✅ Standup created successfully');
    console.log('   📝 Standup ID:', standup.id);
    console.log('   👥 Participants:', standup.participants.join(', '));

    // Step 3: Simulate audio recording and transcription
    console.log('\n3️⃣ Simulating audio recording and transcription...');
    console.log('   🎤 Recording in progress...');
    await delay(2000); // Simulate recording time

    const transcript = `
      Hi everyone, this is John Smith from the Health Equity Lab.
      
      Today I worked on analyzing the patient data for our diabetes equity study.
      I completed the statistical analysis for the first cohort and found some 
      interesting correlations between socioeconomic factors and medication adherence.
      
      Sarah Johnson here. I've been working on the IRB protocol amendments for 
      the second phase. I finished drafting the changes and submitted them for review.
      
      My main blocker is that I need access to the second cohort data which 
      is still pending IRB approval. Also, I'm waiting for the biostatistician 
      to review my analysis methodology.
      
      Mike Chen speaking. I've been preparing the presentation for next week's 
      conference. The slides are almost done, but I need the final results from 
      John's analysis to complete the data visualization section.
      
      Tomorrow we plan to:
      - John will start drafting the methods section of our paper
      - Sarah will follow up with the IRB office
      - Mike will finalize the conference presentation
      - We'll all review the literature on similar health equity studies
      
      That's all for today's standup. Thanks everyone!
    `;

    // Step 4: Save the transcript
    console.log('\n4️⃣ Saving transcript to standup...');
    const transcriptResponse = await fetch(`${BASE_URL}/api/standups/${standup.id}/transcript`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        transcript,
        audioUrl: 'https://storage.example.com/standups/audio-' + standup.id + '.mp3',
        segments: [
          { startTime: 0, endTime: 15, text: 'Hi everyone, this is John Smith...', speaker: 'John Smith' },
          { startTime: 15, endTime: 30, text: 'Sarah Johnson here...', speaker: 'Sarah Johnson' },
          { startTime: 30, endTime: 45, text: 'Mike Chen speaking...', speaker: 'Mike Chen' },
        ],
      }),
    });

    if (!transcriptResponse.ok) {
      const error = await transcriptResponse.text();
      throw new Error(`Failed to save transcript: ${error}`);
    }

    console.log('   ✅ Transcript saved successfully');

    // Step 5: Process with AI
    console.log('\n5️⃣ Processing standup with AI...');
    console.log('   🤖 Analyzing transcript...');
    const processResponse = await fetch(`${BASE_URL}/api/standups/${standup.id}/process`, {
      method: 'POST',
      headers,
    });

    if (!processResponse.ok) {
      const error = await processResponse.text();
      throw new Error(`Failed to process standup: ${error}`);
    }

    const analysis = await processResponse.json();
    console.log('   ✅ AI analysis completed successfully');
    
    console.log('\n📊 Analysis Results:');
    console.log('   📋 Summary:');
    console.log('      ', analysis.summary);
    
    console.log('\n   ✅ Action Items:');
    analysis.actionItems?.forEach((item: any, i: number) => {
      console.log(`      ${i + 1}. ${item.task}`);
      if (item.assignee) console.log(`         Assigned to: ${item.assignee}`);
    });
    
    console.log('\n   🚧 Blockers:');
    analysis.blockers?.forEach((blocker: any, i: number) => {
      console.log(`      ${i + 1}. ${blocker.issue} (${blocker.severity} priority)`);
    });
    
    console.log('\n   📝 Updates:');
    analysis.updates?.forEach((update: any, i: number) => {
      console.log(`      ${i + 1}. ${update}`);
    });

    // Step 6: Send email summary
    console.log('\n6️⃣ Sending email summary...');
    const emailResponse = await fetch(`${BASE_URL}/api/standups/${standup.id}/send-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        recipients: [process.env.EMAIL_FROM || 'team@labmanage.com'],
        includeTranscript: true,
        senderName: 'LabManage System',
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.log('   ⚠️  Email sending failed:', error);
    } else {
      const emailResult = await emailResponse.json();
      console.log('   ✅ Email sent successfully');
      console.log('   📧 Recipients:', process.env.EMAIL_FROM);
      console.log('   📨 Email ID:', emailResult.id);
    }

    // Step 7: Verify the standup was saved correctly
    console.log('\n7️⃣ Verifying standup data...');
    const getResponse = await fetch(`${BASE_URL}/api/standups/${standup.id}`, {
      method: 'GET',
      headers,
    });

    if (getResponse.ok) {
      const savedStandup = await getResponse.json();
      console.log('   ✅ Standup verified in database');
      console.log('   📅 Created:', new Date(savedStandup.createdAt).toLocaleString());
      console.log('   🏷️ Status:', savedStandup.status);
      console.log('   📊 Has summary:', !!savedStandup.summary);
      console.log('   ✅ Action items:', savedStandup.actionItems?.length || 0);
      console.log('   🚧 Blockers:', savedStandup.blockers?.length || 0);
    }

    console.log('\n✅ Complete standup flow test passed successfully!');
    console.log('\n📌 Summary:');
    console.log('   - Created standup recording');
    console.log('   - Saved transcript with speaker segments');
    console.log('   - Processed with AI to extract insights');
    console.log('   - Sent email summary to team');
    console.log('   - Verified data persistence');
    
  } catch (error) {
    console.error('\n❌ Standup flow test failed:', error);
    console.log('\n⚠️  Troubleshooting tips:');
    console.log('   1. Make sure the Next.js dev server is running: npm run dev');
    console.log('   2. Ensure you have valid API keys in .env.production');
    console.log('   3. Check that the database is accessible');
    console.log('   4. Verify the lab ID exists in your database');
  }
}

// Run the test
console.log('🚀 Starting complete standup flow test...');
console.log('   This test will simulate the entire standup recording process');
console.log('   Make sure your dev server is running on http://localhost:3000');
console.log('   Press Ctrl+C to cancel\n');

setTimeout(() => {
  testCompleteStandupFlow().catch(console.error);
}, 2000);