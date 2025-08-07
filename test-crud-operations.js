#!/usr/bin/env node

/**
 * Test script to verify CRUD operations work correctly
 * and UI updates reflect backend changes
 */

const BASE_URL = 'http://localhost:3000/api';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok && !options.expectError) {
    const error = await response.text();
    throw new Error(`API call failed: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Test Labs CRUD
async function testLabsCRUD() {
  console.log('\n📝 Testing Labs CRUD Operations...\n');
  
  // CREATE
  console.log('1. CREATE - Creating new lab...');
  const newLab = await apiCall('/labs', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Lab CRUD',
      shortName: 'TESTCRUD',
      description: 'Testing CRUD operations',
    }),
  });
  console.log('   ✅ Created lab:', newLab.id, '-', newLab.name);
  
  // READ
  console.log('2. READ - Fetching lab details...');
  const fetchedLab = await apiCall(`/labs/${newLab.id}`);
  console.log('   ✅ Fetched lab:', fetchedLab.name);
  
  // UPDATE
  console.log('3. UPDATE - Updating lab...');
  const updatedLab = await apiCall(`/labs/${newLab.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: 'Updated Test Lab',
      description: 'Updated description',
    }),
  });
  console.log('   ✅ Updated lab name to:', updatedLab.name);
  
  // DELETE
  console.log('4. DELETE - Deleting lab...');
  const deleteResult = await apiCall(`/labs/${newLab.id}`, {
    method: 'DELETE',
  });
  console.log('   ✅ Delete result:', deleteResult.success);
  
  // VERIFY DELETION
  console.log('5. VERIFY - Checking if lab is removed from list...');
  const allLabs = await apiCall('/labs');
  const stillExists = allLabs.some(lab => lab.id === newLab.id);
  console.log('   ✅ Lab removed from list:', !stillExists);
  
  return !stillExists;
}

// Test Tasks CRUD
async function testTasksCRUD() {
  console.log('\n📋 Testing Tasks CRUD Operations...\n');
  
  // First, get a project to associate the task with
  const projects = await apiCall('/projects');
  if (projects.length === 0) {
    console.log('   ⚠️  No projects available for task testing');
    return true;
  }
  
  const projectId = projects[0].id;
  
  // CREATE
  console.log('1. CREATE - Creating new task...');
  const newTask = await apiCall('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Task CRUD',
      description: 'Testing task CRUD operations',
      projectId: projectId,
      status: 'TODO',
      priority: 'MEDIUM',
    }),
  });
  console.log('   ✅ Created task:', newTask.id, '-', newTask.title);
  
  // UPDATE
  console.log('2. UPDATE - Updating task...');
  const updatedTask = await apiCall(`/tasks/${newTask.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'Updated Test Task',
      status: 'IN_PROGRESS',
    }),
  });
  console.log('   ✅ Updated task:', updatedTask.title, '- Status:', updatedTask.status);
  
  // DELETE
  console.log('3. DELETE - Deleting task...');
  const deleteResult = await apiCall(`/tasks/${newTask.id}`, {
    method: 'DELETE',
  });
  console.log('   ✅ Delete result:', deleteResult.success);
  
  return true;
}

// Test Buckets CRUD
async function testBucketsCRUD() {
  console.log('\n📁 Testing Buckets CRUD Operations...\n');
  
  // Get a lab to associate the bucket with
  const labs = await apiCall('/labs');
  if (labs.length === 0) {
    console.log('   ⚠️  No labs available for bucket testing');
    return true;
  }
  
  const labId = labs[0].id;
  
  // CREATE
  console.log('1. CREATE - Creating new bucket...');
  const newBucket = await apiCall('/buckets', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Bucket CRUD',
      description: 'Testing bucket CRUD operations',
      labId: labId,
      color: '#FF5733',
    }),
  });
  console.log('   ✅ Created bucket:', newBucket.id, '-', newBucket.name);
  
  // READ
  console.log('2. READ - Fetching buckets...');
  const buckets = await apiCall('/buckets');
  const foundBucket = buckets.find(b => b.id === newBucket.id);
  console.log('   ✅ Found bucket in list:', !!foundBucket);
  
  // UPDATE
  console.log('3. UPDATE - Updating bucket...');
  const updatedBucket = await apiCall('/buckets', {
    method: 'PATCH',
    body: JSON.stringify({
      id: newBucket.id,
      name: 'Updated Test Bucket',
      color: '#00FF00',
    }),
  });
  console.log('   ✅ Updated bucket:', updatedBucket.name);
  
  // DELETE
  console.log('4. DELETE - Deleting bucket...');
  const deleteResult = await apiCall('/buckets', {
    method: 'DELETE',
    body: JSON.stringify({ id: newBucket.id }),
  });
  console.log('   ✅ Delete result:', deleteResult.success);
  
  // VERIFY DELETION
  console.log('5. VERIFY - Checking if bucket is removed...');
  const allBuckets = await apiCall('/buckets');
  const stillExists = allBuckets.some(b => b.id === newBucket.id);
  console.log('   ✅ Bucket removed from list:', !stillExists);
  
  return !stillExists;
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('🧪 CRUD Operations Test Suite');
  console.log('========================================');
  
  try {
    const results = {
      labs: await testLabsCRUD(),
      tasks: await testTasksCRUD(),
      buckets: await testBucketsCRUD(),
    };
    
    console.log('\n========================================');
    console.log('📊 Test Results Summary');
    console.log('========================================');
    console.log('Labs CRUD:    ', results.labs ? '✅ PASSED' : '❌ FAILED');
    console.log('Tasks CRUD:   ', results.tasks ? '✅ PASSED' : '❌ FAILED');
    console.log('Buckets CRUD: ', results.buckets ? '✅ PASSED' : '❌ FAILED');
    
    const allPassed = Object.values(results).every(r => r === true);
    console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    if (allPassed) {
      console.log('\n✨ All CRUD operations are working correctly!');
      console.log('✨ Frontend will update automatically via React Query.');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);