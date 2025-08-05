// Test AI-powered standup feature
async function testStandupAI() {
  console.log('Testing AI-Powered Standup Feature...\n');

  try {
    // 1. Create a standup
    console.log('1. Creating standup...');
    const createResponse = await fetch('http://localhost:3000/api/standups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        labId: 'test-lab',
        participantIds: ['cmdyn1wvo0000xp0eaw40w96r'] // Test user ID
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Failed to create standup: ${error.error}`);
    }
    
    const standup = await createResponse.json();
    console.log(`✓ Standup created: ${standup.id}\n`);

    // 2. Test AI analysis with a realistic transcript
    console.log('2. Testing AI analysis...');
    const testTranscript = `
      Hi everyone, this is Jane Cooper from the Health Equity Labs.
      
      Today I made significant progress on the Abbott project. I completed the 
      data analysis for the first cohort and the preliminary results look promising.
      The response rate is at 78%, which is above our target.
      
      I also met with Dr. Martinez about the Wisconsin R01 grant. We finalized
      the budget and I'll submit it to the grants office by Friday.
      
      Currently, I'm blocked by the IRB approval for the new protocol amendment.
      We need this before we can start recruiting for Phase 2. I've sent follow-up
      emails but haven't heard back yet.
      
      Tomorrow, I plan to:
      - Finish the literature review section for the Abbott manuscript
      - Schedule interviews with three more participants
      - Review the statistical analysis plan with the biostatistics team
      
      One important decision: We've decided to extend the recruitment period
      by two weeks to ensure we meet our sample size requirements.
      
      Also present in today's standup were Michael Chen and Sarah Johnson.
      
      That's all from me. Thanks everyone!
    `;

    const analyzeResponse = await fetch('http://localhost:3000/api/standups/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: testTranscript })
    });
    
    const analysisResult = await analyzeResponse.json();
    
    if (!analyzeResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }
    
    console.log('✓ AI Analysis successful!\n');
    console.log('📊 Analysis Results:');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📝 Summary:');
    console.log(analysisResult.summary);
    console.log('');
    
    console.log('✅ Action Items:');
    if (analysisResult.actionItems?.length > 0) {
      analysisResult.actionItems.forEach((item, i) => {
        console.log(`  ${i+1}. ${item.description}`);
        if (item.assignee) console.log(`     👤 Assigned to: ${item.assignee}`);
        if (item.dueDate) console.log(`     📅 Due: ${new Date(item.dueDate).toLocaleDateString()}`);
      });
    } else {
      console.log('  No action items found');
    }
    console.log('');
    
    console.log('🚧 Blockers:');
    if (analysisResult.blockers?.length > 0) {
      analysisResult.blockers.forEach((blocker, i) => {
        console.log(`  ${i+1}. ${blocker.description}`);
        console.log(`     Status: ${blocker.resolved ? '✓ Resolved' : '⚠️  Active'}`);
      });
    } else {
      console.log('  No blockers found');
    }
    console.log('');
    
    console.log('💡 Decisions:');
    if (analysisResult.decisions?.length > 0) {
      analysisResult.decisions.forEach((decision, i) => {
        console.log(`  ${i+1}. ${decision.description}`);
      });
    } else {
      console.log('  No decisions found');
    }
    console.log('');
    
    console.log('👥 Participants:');
    if (analysisResult.participants?.length > 0) {
      console.log(`  ${analysisResult.participants.join(', ')}`);
    } else {
      console.log('  No participants identified');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('\n✨ Feature Status: AI Recording and Analysis is working!');
    console.log('\n📍 Next Steps:');
    console.log('1. Visit http://localhost:3000/standups');
    console.log('2. Click "New Standup" to record your meeting');
    console.log('3. The AI will automatically transcribe and analyze it');
    console.log('4. Review extracted action items, blockers, and decisions');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('OpenAI API key not configured')) {
      console.log('\n⚠️  OpenAI Configuration Issue:');
      console.log('1. Make sure OPENAI_API_KEY is in your .env file');
      console.log('2. The key should start with "sk-"');
      console.log('3. Restart the server after adding the key');
      console.log('4. Get a key from: https://platform.openai.com/api-keys');
    }
  }
}

// Run the test
testStandupAI();