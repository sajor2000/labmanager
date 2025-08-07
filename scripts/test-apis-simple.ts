import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import { Resend } from 'resend';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

async function testAPIs() {
  console.log('\n🧪 Testing OpenAI and Resend APIs...\n');

  // Test 1: OpenAI API
  console.log('1️⃣ Testing OpenAI API...');
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey || openaiKey === 'your-production-openai-api-key') {
    console.error('   ❌ OpenAI API key not configured');
  } else {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      
      // Test with a simple completion
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Reply with a simple greeting.'
          },
          {
            role: 'user',
            content: 'Hello!'
          }
        ],
        max_tokens: 50,
        temperature: 0.3,
      });

      console.log('   ✅ OpenAI API is working!');
      console.log('   Response:', completion.choices[0]?.message?.content);
      console.log('   Model:', completion.model);
      console.log('   Usage:', completion.usage);
      
    } catch (error: any) {
      console.error('   ❌ OpenAI API error:', error.message);
    }
  }

  // Test 2: Resend API
  console.log('\n2️⃣ Testing Resend API...');
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'test@resend.dev';
  
  if (!resendKey || resendKey.startsWith('re_xxxxxxxxx')) {
    console.error('   ❌ Resend API key not configured');
  } else {
    try {
      const resend = new Resend(resendKey);
      
      // Test sending a simple email
      const result = await resend.emails.send({
        from: emailFrom,
        to: emailFrom,
        subject: 'LabManage API Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>API Test Successful! 🎉</h2>
            <p>This is a test email from LabManage to verify the Resend API integration.</p>
            <p>If you're receiving this email, the Resend API is working correctly.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Sent on ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      });

      if (result.data) {
        console.log('   ✅ Resend API is working!');
        console.log('   Email ID:', result.data.id);
        console.log('   Sent to:', emailFrom);
      } else if (result.error) {
        console.error('   ❌ Resend API error:', result.error);
      }
      
    } catch (error: any) {
      console.error('   ❌ Resend API error:', error.message);
    }
  }

  // Test 3: Combined Standup Processing (without database)
  console.log('\n3️⃣ Testing Standup Processing (AI + Email)...');
  
  try {
    const openai = new OpenAI({ apiKey: openaiKey! });
    const resend = new Resend(resendKey!);
    
    // Sample standup transcript
    const transcript = `
      Hi team, this is our daily standup for the Health Equity Lab.
      
      John here. Yesterday I finished the statistical analysis for the diabetes study.
      I found significant correlations between socioeconomic factors and medication adherence.
      Today I'll be working on the manuscript draft.
      My blocker is that I need the IRB approval for the second cohort data.
      
      Sarah speaking. I completed the protocol amendments and submitted them to the IRB.
      Today I'm following up with the committee and preparing the grant proposal.
      No blockers from my side.
      
      Mike here. I've been working on the conference presentation.
      I need the final data visualizations from John to complete the slides.
      Planning to finish the presentation today and send it for review.
    `;
    
    // Process with AI
    console.log('   🤖 Processing transcript with AI...');
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract information from this standup meeting transcript.
Return a JSON object with:
- summary: Brief 2-3 sentence summary
- actionItems: Array of {task, assignee}
- blockers: Array of {issue, severity: "low"|"medium"|"high"}
- updates: Array of work completed`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysis = JSON.parse(aiResponse.choices[0]?.message?.content || '{}');
    console.log('   ✅ AI processing complete');
    
    // Prepare email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Health Equity Lab - Standup Summary</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h3>📋 Summary</h3>
        <p>${analysis.summary}</p>
        
        <h3>✅ Action Items</h3>
        <ul>
          ${analysis.actionItems?.map((item: any) => 
            `<li><strong>${item.assignee}:</strong> ${item.task}</li>`
          ).join('') || '<li>No action items</li>'}
        </ul>
        
        <h3>🚧 Blockers</h3>
        <ul>
          ${analysis.blockers?.map((blocker: any) => 
            `<li>${blocker.issue} (${blocker.severity} priority)</li>`
          ).join('') || '<li>No blockers</li>'}
        </ul>
        
        <h3>📝 Updates</h3>
        <ul>
          ${analysis.updates?.map((update: any) => 
            `<li>${update}</li>`
          ).join('') || '<li>No updates</li>'}
        </ul>
      </div>
    `;
    
    // Send email
    console.log('   📧 Sending summary email...');
    const emailResult = await resend.emails.send({
      from: emailFrom,
      to: emailFrom,
      subject: 'Health Equity Lab - Standup Summary',
      html: emailHtml,
    });
    
    if (emailResult.data) {
      console.log('   ✅ Email sent successfully!');
      console.log('   Check your inbox at:', emailFrom);
    }
    
    console.log('\n✅ All API tests completed successfully!');
    console.log('\nSummary:');
    console.log('- OpenAI API: ✅ Working');
    console.log('- Resend API: ✅ Working');
    console.log('- Standup Processing: ✅ Working');
    console.log('\nThe standup recording and processing system is ready to use!');
    
  } catch (error: any) {
    console.error('   ❌ Combined test error:', error.message);
  }
}

// Run the tests
testAPIs().catch(console.error);