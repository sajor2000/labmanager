// Complete test script for standup recording feature
const fs = require('fs');
const path = require('path');

async function testStandupFeature() {
  console.log('Testing Standup Recording Feature...\n');

  try {
    // 0. First create a user and lab for testing
    console.log('0. Setting up test data...');
    
    // Create a user
    const userResponse = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        role: 'RESEARCH_MEMBER'
      })
    });
    
    let userId;
    if (userResponse.ok) {
      const user = await userResponse.json();
      userId = user.id;
      console.log(`✓ User created: ${user.name}`);
    } else {
      // User might already exist, try to get it
      const getUserResponse = await fetch('http://localhost:3000/api/users?email=test@example.com');
      if (getUserResponse.ok) {
        const users = await getUserResponse.json();
        if (users.length > 0) {
          userId = users[0].id;
          console.log(`✓ Using existing user: ${users[0].name}`);
        }
      }
    }

    // Create a lab
    const labResponse = await fetch('http://localhost:3000/api/labs', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'test-lab',
        name: 'Test Lab',
        description: 'Lab for testing standup feature',
        principalInvestigator: userId || 'test-user'
      })
    });

    let labId;
    if (labResponse.ok) {
      const lab = await labResponse.json();
      labId = lab.id;
      console.log(`✓ Lab created: ${lab.name}`);
    } else {
      // Lab might already exist
      labId = 'test-lab';
      console.log('✓ Using existing lab: test-lab');
    }

    // 1. Create a standup
    console.log('\n1. Creating new standup...');
    const createResponse = await fetch('http://localhost:3000/api/standups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        labId: labId,
        participantIds: userId ? [userId] : []
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create standup: ${error.error}`);
    }
    
    const standup = await createResponse.json();
    console.log(`✓ Standup created with ID: ${standup.id}\n`);

    // 2. Create a test audio file with actual speech simulation
    console.log('2. Creating test audio with speech...');
    
    // Create a more realistic test - use a small MP3 or create one
    const testAudioPath = path.join(__dirname, 'test-audio.txt');
    fs.writeFileSync(testAudioPath, 'This is a test standup. Today I worked on fixing bugs in the authentication system. I\'m blocked by the API rate limiting issue. Tomorrow I plan to implement the new dashboard feature.');
    
    console.log('✓ Test transcript created\n');

    // 3. Test transcription with mock data
    console.log('3. Testing transcription simulation...');
    
    // For testing without actual audio, let's directly test the analysis
    const testTranscript = `
      Hi everyone, this is Jane from the Health Equity Lab.
      
      Today I completed the data analysis for the Abbott study. 
      I also started working on the manuscript draft for the Wisconsin R01 project.
      
      I'm currently blocked by the IRB approval delay for the new cohort study.
      We need to get this resolved before we can start recruiting participants.
      
      Tomorrow I plan to finish the literature review section and meet with Dr. Smith
      to discuss the statistical analysis plan.
      
      One important decision we made today: we're going to use the new REDCap 
      database for data collection instead of the old system.
      
      That's all from me. Thanks!
    `;

    // 4. Test the analysis endpoint directly
    console.log('4. Testing AI analysis...');
    const analyzeResponse = await fetch('http://localhost:3000/api/standups/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: testTranscript })
    });
    
    const analyzeResult = await analyzeResponse.json();
    
    if (!analyzeResponse.ok) {
      console.log(`✗ Analysis failed: ${analyzeResult.error}`);
      if (analyzeResult.error === 'OpenAI API key not configured') {
        console.log('\n⚠️  OpenAI API key is not configured properly');
        console.log('Please ensure OPENAI_API_KEY is set in your .env file');
        console.log('and restart the server after adding it.\n');
      }
    } else {
      console.log('✓ AI Analysis successful!');
      console.log('\nExtracted Information:');
      console.log('  Summary:', analyzeResult.summary);
      console.log('  Action Items:', analyzeResult.actionItems?.length || 0);
      analyzeResult.actionItems?.forEach((item, i) => {
        console.log(`    ${i+1}. ${item.description}`);
        if (item.assignee) console.log(`       Assigned to: ${item.assignee}`);
      });
      console.log('  Blockers:', analyzeResult.blockers?.length || 0);
      analyzeResult.blockers?.forEach((blocker, i) => {
        console.log(`    ${i+1}. ${blocker.description}`);
      });
      console.log('  Decisions:', analyzeResult.decisions?.length || 0);
      analyzeResult.decisions?.forEach((decision, i) => {
        console.log(`    ${i+1}. ${decision.description}`);
      });
      console.log('  Participants:', analyzeResult.participants?.join(', ') || 'None identified');
    }

    // 5. Check standup page accessibility
    console.log('\n5. Checking standup page...');
    const pageResponse = await fetch('http://localhost:3000/standups');
    if (pageResponse.ok) {
      console.log('✓ Standup page is accessible');
      console.log('  Visit http://localhost:3000/standups to use the feature');
    }

    // Clean up test file
    if (fs.existsSync(testAudioPath)) {
      fs.unlinkSync(testAudioPath);
    }

  } catch (error) {
    console.error('\nTest failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Use native fetch in Node.js 18+
testStandupFeature();