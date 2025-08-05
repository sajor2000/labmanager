// Test script for standup recording feature
const fs = require('fs');
const path = require('path');

async function testStandupFeature() {
  console.log('Testing Standup Recording Feature...\n');

  try {
    // 1. Create a standup
    console.log('1. Creating new standup...');
    const createResponse = await fetch('http://localhost:3000/api/standups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labId: 'rhedas' })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create standup: ${createResponse.status}`);
    }
    
    const standup = await createResponse.json();
    console.log(`✓ Standup created with ID: ${standup.id}\n`);

    // 2. Create a test audio file (silent audio)
    console.log('2. Creating test audio file...');
    const audioBuffer = Buffer.alloc(44100 * 2); // 1 second of silence
    
    // Create a simple WAV header
    const wavHeader = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.alloc(4), // chunk size placeholder
      Buffer.from('WAVE'),
      Buffer.from('fmt '),
      Buffer.from([16, 0, 0, 0]), // fmt chunk size
      Buffer.from([1, 0]), // audio format (PCM)
      Buffer.from([1, 0]), // channels
      Buffer.from([68, 172, 0, 0]), // sample rate (44100)
      Buffer.from([136, 88, 1, 0]), // byte rate
      Buffer.from([2, 0]), // block align
      Buffer.from([16, 0]), // bits per sample
      Buffer.from('data'),
      Buffer.from([audioBuffer.length & 0xff, (audioBuffer.length >> 8) & 0xff, 0, 0]), // data size
      audioBuffer
    ]);
    
    console.log('✓ Test audio created\n');

    // 3. Test transcription endpoint directly
    console.log('3. Testing transcription endpoint...');
    const formData = new FormData();
    const audioBlob = new Blob([wavHeader], { type: 'audio/wav' });
    formData.append('audio', audioBlob, 'test.wav');
    
    const transcribeResponse = await fetch('http://localhost:3000/api/standups/transcribe', {
      method: 'POST',
      body: formData
    });
    
    const transcribeResult = await transcribeResponse.json();
    console.log('Transcription response:', transcribeResult);
    
    if (!transcribeResponse.ok) {
      console.log(`✗ Transcription failed: ${transcribeResult.error}\n`);
    } else {
      console.log(`✓ Transcription successful\n`);
    }

    // 4. Test if OpenAI is configured
    console.log('4. Checking OpenAI configuration...');
    const hasOpenAI = transcribeResult.error !== 'OpenAI API key not configured';
    
    if (hasOpenAI) {
      console.log('✓ OpenAI API is configured and accessible\n');
      
      // 5. Test the full processing pipeline
      console.log('5. Testing full processing pipeline...');
      const processFormData = new FormData();
      processFormData.append('audio', audioBlob, 'standup.wav');
      
      const processResponse = await fetch(`http://localhost:3000/api/standups/${standup.id}/process`, {
        method: 'POST',
        body: processFormData
      });
      
      const processResult = await processResponse.json();
      
      if (processResponse.ok) {
        console.log('✓ Audio processing successful');
        console.log('  - Transcript:', processResult.transcript || 'No speech detected');
        console.log('  - Action Items:', processResult.actionItems?.length || 0);
        console.log('  - Blockers:', processResult.blockers?.length || 0);
        console.log('  - Decisions:', processResult.decisions?.length || 0);
      } else {
        console.log(`✗ Processing failed: ${processResult.error}`);
      }
    } else {
      console.log('✗ OpenAI API key is not configured');
      console.log('  Please add your OpenAI API key to the .env file');
    }

    // 6. Check database storage
    console.log('\n6. Checking database storage...');
    const getResponse = await fetch(`http://localhost:3000/api/standups/${standup.id}`);
    if (getResponse.ok) {
      const savedStandup = await getResponse.json();
      console.log('✓ Standup saved in database');
      console.log(`  - Audio URL: ${savedStandup.audioUrl || 'Not saved'}`);
      console.log(`  - Has transcript: ${savedStandup.transcriptArchive ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Use native fetch in Node.js 18+
testStandupFeature();