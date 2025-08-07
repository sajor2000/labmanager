import { config } from 'dotenv';
import { resolve } from 'path';
import fetch from 'node-fetch';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

const BASE_URL = 'http://localhost:3001'; // Using port 3001 as shown in logs

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithExistingLab() {
  console.log('\n🎙️ Testing Standup Flow with Minimal Setup...\n');

  try {
    // Create a simple standup without authentication
    console.log('1️⃣ Creating a standup without complex authentication...');
    
    // First, let's get an existing lab
    const labsResponse = await fetch(`${BASE_URL}/api/labs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (labsResponse.ok) {
      const labs = await labsResponse.json();
      console.log('   Found', labs.length, 'labs');
      
      if (labs.length > 0) {
        const firstLab = labs[0];
        console.log('   Using lab:', firstLab.name, '(ID:', firstLab.id, ')');
        
        // Now create a standup for this lab
        console.log('\n2️⃣ Creating standup...');
        const createResponse = await fetch(`${BASE_URL}/api/standups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            labId: firstLab.id,
            participants: ['Test User 1', 'Test User 2'],
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.text();
          console.log('   ❌ Failed to create standup:', error);
          return;
        }

        const standup = await createResponse.json();
        console.log('   ✅ Standup created:', standup.id);
        
        // Test AI processing
        console.log('\n3️⃣ Testing AI processing directly...');
        const testTranscript = `
          Hi, this is a test standup meeting.
          
          Today I worked on implementing the new dashboard features.
          I completed the basic layout and added the metrics cards.
          
          My blocker is that I need access to the production API endpoints.
          Also waiting for design approval on the color scheme.
          
          Tomorrow I plan to:
          - Continue working on the dashboard
          - Write tests for the new components
          - Review pull requests from the team
        `;

        const analyzeResponse = await fetch(`${BASE_URL}/api/standups/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: testTranscript,
          }),
        });

        if (!analyzeResponse.ok) {
          const error = await analyzeResponse.text();
          console.log('   ❌ AI analysis failed:', error);
        } else {
          const analysis = await analyzeResponse.json();
          console.log('   ✅ AI analysis successful');
          console.log('\n📊 Results:');
          console.log('   Summary:', analysis.summary);
          console.log('   Action Items:', analysis.actionItems?.length || 0);
          console.log('   Blockers:', analysis.blockers?.length || 0);
          console.log('   Updates:', analysis.updates?.length || 0);
        }
        
      } else {
        console.log('   ⚠️  No labs found. Please create a lab first.');
      }
    } else {
      console.log('   ❌ Failed to fetch labs');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
console.log('🚀 Starting simplified standup test...');
console.log('   Using server at:', BASE_URL);

testWithExistingLab().catch(console.error);