#!/usr/bin/env npx tsx
/**
 * Comprehensive test for lab filtering across all pages
 */

import { prisma } from '../lib/prisma';

interface LabData {
  id: string;
  name: string;
  shortName: string;
  buckets: number;
  projects: number;
  tasks: number;
  ideas: number;
  standups: number;
  members: number;
}

async function testAllLabFiltering() {
  console.log('🧪 COMPREHENSIVE LAB FILTERING TEST\n');
  console.log('=' .repeat(50));
  console.log();

  try {
    // 1. Get all labs
    const labs = await prisma.lab.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
      },
    });
    
    console.log(`📋 Found ${labs.length} labs:`);
    labs.forEach(lab => {
      console.log(`  - ${lab.shortName}: ${lab.name}`);
    });
    console.log();

    // 2. Collect data for each lab
    const labDataMap: Map<string, LabData> = new Map();
    
    for (const lab of labs) {
      console.log(`\n📊 Analyzing data for ${lab.shortName}:`);
      console.log('─'.repeat(40));
      
      const [buckets, projects, tasks, ideas, standups, members] = await Promise.all([
        prisma.bucket.count({ where: { labId: lab.id } }),
        prisma.project.count({ where: { labId: lab.id } }),
        prisma.task.count({ where: { project: { labId: lab.id } } }),
        prisma.idea.count({ where: { labId: lab.id } }),
        prisma.standup.count({ where: { labId: lab.id } }),
        prisma.labMember.count({ where: { labId: lab.id } }),
      ]);
      
      const labData: LabData = {
        id: lab.id,
        name: lab.name,
        shortName: lab.shortName,
        buckets,
        projects,
        tasks,
        ideas,
        standups,
        members,
      };
      
      labDataMap.set(lab.id, labData);
      
      console.log(`  📦 Buckets: ${buckets}`);
      console.log(`  📚 Projects/Studies: ${projects}`);
      console.log(`  ✅ Tasks: ${tasks}`);
      console.log(`  💡 Ideas: ${ideas}`);
      console.log(`  🎙️ Standups: ${standups}`);
      console.log(`  👥 Team Members: ${members}`);
    }

    // 3. Test API endpoints
    console.log('\n\n🌐 TESTING API ENDPOINTS:');
    console.log('=' .repeat(50));
    
    const apiTests = [
      { name: 'Buckets', endpoint: '/api/buckets' },
      { name: 'Studies', endpoint: '/api/projects' },
      { name: 'Ideas', endpoint: '/api/ideas' },
      { name: 'Team', endpoint: '/api/teams' },
      { name: 'Standups', endpoint: '/api/standups' },
    ];
    
    for (const test of apiTests) {
      console.log(`\n📡 Testing ${test.name} API:`);
      console.log('─'.repeat(30));
      
      for (const lab of labs) {
        const url = `http://localhost:3001${test.endpoint}?labId=${lab.id}`;
        
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : data.data?.length || 0;
            const expected = labDataMap.get(lab.id);
            
            let expectedCount = 0;
            switch(test.name) {
              case 'Buckets': expectedCount = expected?.buckets || 0; break;
              case 'Studies': expectedCount = expected?.projects || 0; break;
              case 'Ideas': expectedCount = expected?.ideas || 0; break;
              case 'Team': expectedCount = expected?.members || 0; break;
              case 'Standups': expectedCount = expected?.standups || 0; break;
            }
            
            const match = count === expectedCount ? '✅' : '⚠️';
            console.log(`  ${match} ${lab.shortName}: ${count} items (expected: ${expectedCount})`);
          } else {
            console.log(`  ❌ ${lab.shortName}: API returned ${response.status}`);
          }
        } catch (error) {
          console.log(`  ⚠️ ${lab.shortName}: Could not reach API`);
        }
      }
    }

    // 4. Test page loads with different labs
    console.log('\n\n🖥️ TESTING PAGE LOADS:');
    console.log('=' .repeat(50));
    
    const pages = [
      '/overview',
      '/buckets', 
      '/studies',
      '/ideas',
      '/team',
      '/standups',
      '/deadlines',
    ];
    
    for (const page of pages) {
      console.log(`\n📄 Testing ${page}:`);
      
      for (const lab of labs) {
        // Simulate page load with lab context
        const url = `http://localhost:3001${page}`;
        
        try {
          const response = await fetch(url, {
            headers: {
              'Cookie': `selectedLabId=${lab.id}`, // Simulate lab selection
            },
          });
          
          if (response.ok) {
            console.log(`  ✅ ${lab.shortName}: Page loads successfully`);
          } else {
            console.log(`  ⚠️ ${lab.shortName}: Page returned ${response.status}`);
          }
        } catch (error) {
          console.log(`  ⚠️ ${lab.shortName}: Could not load page`);
        }
      }
    }

    // 5. Summary Report
    console.log('\n\n📊 SUMMARY REPORT:');
    console.log('=' .repeat(50));
    
    const totals = {
      buckets: 0,
      projects: 0,
      tasks: 0,
      ideas: 0,
      standups: 0,
      members: 0,
    };
    
    labDataMap.forEach(data => {
      totals.buckets += data.buckets;
      totals.projects += data.projects;
      totals.tasks += data.tasks;
      totals.ideas += data.ideas;
      totals.standups += data.standups;
      totals.members += data.members;
    });
    
    console.log('\n📈 Total across all labs:');
    console.log(`  📦 Buckets: ${totals.buckets}`);
    console.log(`  📚 Projects: ${totals.projects}`);
    console.log(`  ✅ Tasks: ${totals.tasks}`);
    console.log(`  💡 Ideas: ${totals.ideas}`);
    console.log(`  🎙️ Standups: ${totals.standups}`);
    console.log(`  👥 Members: ${totals.members}`);
    
    console.log('\n📊 Distribution by lab:');
    labDataMap.forEach(data => {
      console.log(`\n  ${data.shortName}:`);
      console.log(`    Buckets: ${data.buckets} (${((data.buckets/totals.buckets)*100).toFixed(1)}%)`);
      console.log(`    Projects: ${data.projects} (${((data.projects/totals.projects)*100).toFixed(1)}%)`);
      console.log(`    Tasks: ${data.tasks} (${totals.tasks > 0 ? ((data.tasks/totals.tasks)*100).toFixed(1) : 0}%)`);
      console.log(`    Ideas: ${data.ideas} (${totals.ideas > 0 ? ((data.ideas/totals.ideas)*100).toFixed(1) : 0}%)`);
      console.log(`    Standups: ${data.standups} (${totals.standups > 0 ? ((data.standups/totals.standups)*100).toFixed(1) : 0}%)`);
      console.log(`    Members: ${data.members} (${totals.members > 0 ? ((data.members/totals.members)*100).toFixed(1) : 0}%)`);
    });

    console.log('\n\n✅ Lab filtering test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAllLabFiltering().catch(console.error);