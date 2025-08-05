#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '.env');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔑 OpenAI API Key Configuration\n');
console.log('This script will help you update your OpenAI API key.\n');

// Read current .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const currentKey = envContent.match(/OPENAI_API_KEY="(.*)"/)?.[1] || 'Not found';

console.log(`Current value: ${currentKey}\n`);

if (currentKey === 'your-openai-api-key-here') {
  console.log('⚠️  You still have the placeholder value!');
  console.log('Please enter your actual OpenAI API key below.');
  console.log('(It should start with "sk-")\n');
  
  rl.question('Enter your OpenAI API key: ', (apiKey) => {
    if (!apiKey.startsWith('sk-')) {
      console.log('\n❌ Invalid key format. OpenAI keys start with "sk-"');
      rl.close();
      return;
    }
    
    // Update the .env file
    const updatedContent = envContent.replace(
      /OPENAI_API_KEY=".*"/,
      `OPENAI_API_KEY="${apiKey}"`
    );
    
    fs.writeFileSync(envPath, updatedContent);
    console.log('\n✅ API key updated successfully!');
    console.log('Please restart your development server for changes to take effect.\n');
    
    rl.close();
  });
} else if (currentKey.startsWith('sk-')) {
  console.log('✅ You already have a valid OpenAI API key configured!');
  console.log('\nIf the standup feature is not working, please check:');
  console.log('1. The key is valid and has not expired');
  console.log('2. The key has access to GPT-4 and Whisper models');
  console.log('3. You have restarted the server after adding the key\n');
  rl.close();
} else {
  console.log('❓ Current value doesn\'t look like a valid OpenAI key.');
  rl.question('\nWould you like to update it? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      rl.question('Enter your OpenAI API key: ', (apiKey) => {
        if (!apiKey.startsWith('sk-')) {
          console.log('\n❌ Invalid key format. OpenAI keys start with "sk-"');
          rl.close();
          return;
        }
        
        const updatedContent = envContent.replace(
          /OPENAI_API_KEY=".*"/,
          `OPENAI_API_KEY="${apiKey}"`
        );
        
        fs.writeFileSync(envPath, updatedContent);
        console.log('\n✅ API key updated successfully!');
        console.log('Please restart your development server.\n');
        
        rl.close();
      });
    } else {
      rl.close();
    }
  });
}