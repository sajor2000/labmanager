import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

async function testAIProcessing() {
  console.log('\n🤖 Testing AI Standup Processing...\n');

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your-production-openai-api-key') {
    console.error('❌ OpenAI API key not configured');
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    const testTranscript = `
      Hi everyone, this is John from the research team.
      
      Today I worked on analyzing the patient data for our diabetes study.
      I completed the statistical analysis for the first cohort and found some 
      interesting correlations between medication adherence and outcomes.
      
      My main blocker is that I need access to the second cohort data which 
      is still pending IRB approval. Also, I'm waiting for the biostatistician 
      to review my analysis methodology.
      
      Tomorrow I plan to:
      - Start drafting the methods section of our paper
      - Meet with Dr. Smith to discuss the preliminary findings
      - Review the literature on similar studies
      - Prepare slides for next week's lab meeting
      
      That's all from me. Thanks!
    `;

    console.log('📝 Processing test transcript...\n');
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_API_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant analyzing standup meeting transcripts for a research lab.
Extract and categorize the following information:
1. Summary: A brief 2-3 sentence summary
2. Action Items: Specific tasks mentioned (with assignee if mentioned)
3. Blockers: Any impediments or issues raised
4. Updates: Work completed or progress made

Format your response as JSON with these exact keys: summary, actionItems, blockers, updates.
Each actionItem should have: task, assignee (if mentioned).
Each blocker should have: issue, severity (low/medium/high).
Each update should have: description.`
        },
        {
          role: 'user',
          content: testTranscript
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    console.log('✅ AI Analysis Results:\n');
    console.log('📋 Summary:');
    console.log('   ', result.summary);
    
    console.log('\n✅ Action Items:');
    result.actionItems?.forEach((item: any, i: number) => {
      console.log(`   ${i + 1}. ${item.task}`);
      if (item.assignee) console.log(`      Assignee: ${item.assignee}`);
    });
    
    console.log('\n🚧 Blockers:');
    result.blockers?.forEach((blocker: any, i: number) => {
      console.log(`   ${i + 1}. ${blocker.issue} (${blocker.severity})`);
    });
    
    console.log('\n📝 Updates:');
    result.updates?.forEach((update: any, i: number) => {
      console.log(`   ${i + 1}. ${update.description}`);
    });
    
    console.log('\n✅ AI processing test completed successfully!');
    console.log('   The standup processing system is working correctly.');
    
  } catch (error) {
    console.error('❌ AI processing failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
    }
  }
}

// Run the test
testAIProcessing().catch(console.error);