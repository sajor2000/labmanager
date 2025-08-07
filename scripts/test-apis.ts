import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import { Resend } from 'resend';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env.production'), override: true });

async function testOpenAI() {
  console.log('\n🤖 Testing OpenAI API...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your-production-openai-api-key') {
    console.error('❌ OpenAI API key not configured properly');
    console.log('   Please set OPENAI_API_KEY in your .env.local or .env.production file');
    return false;
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "API test successful" in 5 words or less.' }
      ],
      max_tokens: 20,
    });

    console.log('✅ OpenAI API test successful!');
    console.log('   Response:', completion.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('❌ OpenAI API test failed:');
    if (error instanceof Error) {
      console.error('   ', error.message);
    }
    return false;
  }
}

async function testResend() {
  console.log('\n📧 Testing Resend API...');
  
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'test@resend.dev';
  
  if (!apiKey || apiKey.startsWith('re_xxxxxxxxx')) {
    console.error('❌ Resend API key not configured properly');
    console.log('   Please set RESEND_API_KEY in your .env.local or .env.production file');
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    
    // Test by sending a test email
    const result = await resend.emails.send({
      from: emailFrom,
      to: emailFrom, // Send to same address for testing
      subject: 'LabManage API Test',
      html: '<p>This is a test email from LabManage to verify Resend API is working.</p>',
    });

    console.log('✅ Resend API test successful!');
    console.log('   Email ID:', result.data?.id);
    console.log('   Check your inbox at:', emailFrom);
    return true;
  } catch (error) {
    console.error('❌ Resend API test failed:');
    if (error instanceof Error) {
      console.error('   ', error.message);
    }
    return false;
  }
}

async function testStandupProcessing() {
  console.log('\n🎙️ Testing Standup Processing Flow...');
  
  // Check if both APIs are working
  const openAIWorks = await testOpenAI();
  const resendWorks = await testResend();
  
  if (!openAIWorks) {
    console.log('\n⚠️  Standup processing requires OpenAI API for:');
    console.log('   - Transcription analysis');
    console.log('   - Action item extraction');
    console.log('   - Blocker identification');
    console.log('   - Summary generation');
  }
  
  if (!resendWorks) {
    console.log('\n⚠️  Email notifications require Resend API for:');
    console.log('   - Sending standup summaries');
    console.log('   - Team notifications');
  }
  
  if (openAIWorks && resendWorks) {
    console.log('\n✅ All APIs configured correctly!');
    console.log('   Standup processing should work properly.');
  } else {
    console.log('\n❌ Some APIs need configuration before standup processing will work fully.');
  }
}

// Run all tests
async function main() {
  console.log('🧪 Testing LabManage APIs...');
  console.log('================================');
  
  await testStandupProcessing();
  
  console.log('\n================================');
  console.log('🏁 API testing complete!\n');
}

main().catch(console.error);