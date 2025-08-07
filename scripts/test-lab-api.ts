#!/usr/bin/env npx tsx
/**
 * Test lab filtering via API endpoints
 */

const BASE_URL = 'http://localhost:3000';

// Known lab IDs from the database
const LABS = [
  { id: 'cmdxbrm9b0000yoklf7ll7uf0', name: 'RICCC' },
  { id: 'cmdxbrmbg0001yoklc1zcx7n1', name: 'RHEDAS' },
];

async function testLabFilteringAPI() {
  console.log('🧪 LAB FILTERING API TEST\n');
  console.log('=' .repeat(50));
  console.log();

  // Test each endpoint for each lab
  const endpoints = [
    { name: 'Buckets', path: '/api/buckets' },
    { name: 'Projects', path: '/api/projects' },
    { name: 'Ideas', path: '/api/ideas' },
    { name: 'Standups', path: '/api/standups' },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing ${endpoint.name}:`);
    console.log('─'.repeat(30));
    
    // Test without lab filter
    try {
      const allResponse = await fetch(`${BASE_URL}${endpoint.path}`);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        const allCount = Array.isArray(allData) ? allData.length : 0;
        console.log(`  📊 All labs: ${allCount} items`);
      }
    } catch (error) {
      console.log(`  ⚠️ Could not fetch all items`);
    }
    
    // Test with lab filter
    for (const lab of LABS) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint.path}?labId=${lab.id}`);
        if (response.ok) {
          const data = await response.json();
          const count = Array.isArray(data) ? data.length : 0;
          console.log(`  ✅ ${lab.name}: ${count} items`);
        } else {
          console.log(`  ❌ ${lab.name}: API returned ${response.status}`);
        }
      } catch (error) {
        console.log(`  ⚠️ ${lab.name}: Could not reach API`);
      }
    }
  }

  // Test page navigation with lab context
  console.log('\n\n🖥️ TESTING PAGE NAVIGATION:');
  console.log('=' .repeat(50));
  
  const pages = [
    '/overview',
    '/buckets', 
    '/studies',
    '/ideas',
    '/team',
    '/standups',
  ];
  
  for (const page of pages) {
    try {
      const response = await fetch(`${BASE_URL}${page}`);
      if (response.ok) {
        console.log(`  ✅ ${page}: Page loads`);
      } else {
        console.log(`  ⚠️ ${page}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${page}: Could not load`);
    }
  }

  console.log('\n\n✅ API test completed!');
}

// Run the test
testLabFilteringAPI().catch(console.error);