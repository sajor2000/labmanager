# LabSync API Postman Collection

Comprehensive API testing suite for the LabSync Research Platform.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Collection Structure](#collection-structure)
- [Running Tests](#running-tests)
- [Test Data Generation](#test-data-generation)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

1. **Import Collection & Environment**
   - Open Postman
   - Click "Import" button
   - Select `LabSync-API-Collection.json`
   - Import `LabSync-Environment.json`

2. **Set Active Environment**
   - Select "LabSync Development" from environment dropdown
   - Update `base_url` if not using localhost:3001

3. **Run Health Check**
   - Navigate to "Health & Status" folder
   - Run "Health Check" request
   - Should return `{"status": "healthy"}`

## 📦 Installation

### Prerequisites
- Postman Desktop App (v10.0+) or Web Version
- LabSync API running locally
- Database with seed data

### Import Process

```bash
# 1. Start your development server
npm run dev

# 2. Ensure database is seeded
npm run db:seed

# 3. Import files in Postman:
- LabSync-API-Collection.json
- LabSync-Environment.json
```

## ⚙️ Configuration

### Environment Variables

Key variables to configure:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `http://localhost:3001/api` |
| `user_id` | Default user ID | Set from seed data |
| `lab_id` | Default lab ID | RICCC lab ID |
| `auth_token` | Bearer token (if auth enabled) | Empty |

### Dynamic Variables

These are automatically set during test execution:
- `project_id` - Set after creating/fetching projects
- `task_id` - Set after creating/fetching tasks
- `comment_id` - Set after creating comments
- Various `created_*_id` variables for cleanup

## 📁 Collection Structure

```
LabSync API Collection/
├── 🏥 Labs Management (5 requests)
│   ├── Get All Labs
│   ├── Get Lab by ID
│   ├── Create New Lab
│   ├── Update Lab
│   └── Get Lab Members
│
├── 📦 Buckets (4 requests)
│   ├── Get All Buckets
│   ├── Create Bucket
│   ├── Update Bucket Position
│   └── Delete Bucket
│
├── 🔬 Projects/Studies (4 requests)
│   ├── Get All Projects
│   ├── Create Project
│   ├── Update Project Status
│   └── Search Projects
│
├── ✅ Tasks (5 requests)
│   ├── Get All Tasks
│   ├── Create Task
│   ├── Update Task
│   ├── Move Task
│   └── Delete Task
│
├── 💬 Comments (4 requests)
│   ├── Get Comments
│   ├── Create Comment
│   ├── Get Comment Replies
│   └── Delete Comment
│
├── 👥 Team & Users (3 requests)
│   ├── Get Current User
│   ├── Get Team Members
│   └── Search Users
│
├── 📊 Dashboard & Analytics (2 requests)
│   ├── Get Dashboard Metrics
│   └── Get Deadlines
│
├── 🔍 Search (1 request)
│   └── Global Search
│
├── 🎯 Health & Status (1 request)
│   └── Health Check
│
└── ❌ Error Handling Tests (2 requests)
    ├── 404 - Resource Not Found
    └── 400 - Bad Request
```

## 🧪 Running Tests

### Individual Request Testing

1. Select a request from the collection
2. Click "Send" button
3. Review response and test results in "Test Results" tab

### Collection Runner

Run entire test suites:

```javascript
// 1. Open Collection Runner
// 2. Select "LabSync API Collection"
// 3. Choose environment
// 4. Configure:
{
  "iterations": 1,
  "delay": 100,  // ms between requests
  "data": null,   // or CSV file for data-driven testing
  "saveResponses": true
}
// 5. Click "Run LabSync API"
```

### Test Scripts

Each request includes automated tests:

```javascript
// Example test structure
pm.test("Status code is 200", () => {
    pm.response.to.have.status(200);
});

pm.test("Response time is less than 500ms", () => {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response has required fields", () => {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('id');
    pm.expect(jsonData).to.have.property('name');
});
```

## 🎲 Test Data Generation

Use the `test-data-generator.js` functions in pre-request scripts:

### Example: Generate Project Data

```javascript
// In Pre-request Script tab
const timestamp = Date.now();
const projectName = `Clinical Trial: COVID-19 Vaccine - Phase ${Math.floor(Math.random() * 3) + 1}`;
const oraNumber = `ORA-${new Date().getFullYear()}-${timestamp.toString().slice(-3)}`;

pm.environment.set('new_project_name', projectName);
pm.environment.set('new_ora_number', oraNumber);

// Generate future due date
const dueDate = new Date();
dueDate.setMonth(dueDate.getMonth() + 3);
pm.environment.set('project_due_date', dueDate.toISOString());
```

### Available Generators

- `generateProjectName()` - Medical research project names
- `generateORANumber()` - ORA numbers with current year
- `generateIRBNumber()` - IRB protocol numbers
- `generateTeamMember()` - Realistic team member data
- `generateTask()` - Research-related tasks
- `generateComment()` - Comments with optional mentions
- `generateFutureDate(days)` - Future dates for deadlines
- `generatePriority()` - Weighted priority distribution
- `generateProjectStatus()` - Valid project statuses

## 📊 Test Scenarios

### Smoke Test Suite
Quick health check of critical endpoints:
```
1. Health Check → 200 OK
2. Get Labs → Returns array
3. Get Projects → Returns paginated data
4. Get Current User → Returns user object
```

### CRUD Test Flow
Complete create-read-update-delete cycle:
```
1. Create Project → Store ID
2. Get Project by ID → Verify creation
3. Update Project Status → Verify change
4. Add Task to Project → Store Task ID
5. Add Comment to Task → Verify threading
6. Delete Task → Verify soft delete
7. Delete Project → Cleanup
```

### Performance Test
Check response times under load:
```javascript
// Run with Collection Runner
// Set iterations: 10
// Set delay: 0
// Monitor average response time
```

## 💡 Best Practices

### 1. Use Environment Variables
Never hardcode IDs or URLs:
```javascript
// ❌ Bad
"url": "http://localhost:3001/api/projects/abc123"

// ✅ Good
"url": "{{base_url}}/projects/{{project_id}}"
```

### 2. Chain Requests
Use test scripts to pass data between requests:
```javascript
// In test script of "Create Project"
const project = pm.response.json();
pm.environment.set('created_project_id', project.id);

// Next request can use {{created_project_id}}
```

### 3. Clean Up Test Data
Add cleanup requests at the end of test runs:
```javascript
// Delete created test data
pm.sendRequest({
    url: `${pm.environment.get('base_url')}/projects/${pm.environment.get('created_project_id')}`,
    method: 'DELETE',
    header: {
        'Content-Type': 'application/json'
    }
}, (err, res) => {
    console.log('Cleanup completed');
});
```

### 4. Validate Response Schema
Use JSON Schema validation:
```javascript
const schema = {
    type: "object",
    required: ["id", "name", "status"],
    properties: {
        id: { type: "string" },
        name: { type: "string" },
        status: { 
            type: "string",
            enum: ["ACTIVE", "COMPLETED", "ON_HOLD"]
        }
    }
};

pm.test("Schema is valid", () => {
    pm.response.to.have.jsonSchema(schema);
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```
**Solution**: Ensure your development server is running (`npm run dev`)

#### 2. 404 Not Found
```
Status: 404 Not Found
```
**Solution**: Check the `base_url` environment variable matches your server

#### 3. Missing Required Fields
```
Error: Missing required field: labId
```
**Solution**: Ensure environment variables are set, especially `lab_id`

#### 4. Authentication Errors
```
Status: 401 Unauthorized
```
**Solution**: Set `user_id` in environment or implement proper auth

#### 5. Database Connection
```
Error: Database connection failed
```
**Solution**: Check database is running and properly seeded

### Debug Mode

Enable console logging in pre-request scripts:
```javascript
console.log('Environment:', pm.environment.toObject());
console.log('Request URL:', pm.request.url.toString());
console.log('Request Body:', pm.request.body.toString());
```

View console output:
- Open Postman Console (View → Show Postman Console)
- Or use keyboard shortcut: `Ctrl+Alt+C` (Windows) or `Cmd+Alt+C` (Mac)

## 📈 Performance Metrics

Expected response times for optimized endpoints:

| Endpoint Type | Target | Acceptable | Maximum |
|---------------|--------|------------|---------|
| Health Check | < 50ms | < 100ms | 200ms |
| Simple GET | < 100ms | < 200ms | 500ms |
| Complex GET (with joins) | < 200ms | < 500ms | 1000ms |
| POST/PUT | < 200ms | < 500ms | 1000ms |
| Search | < 300ms | < 700ms | 1500ms |
| Bulk Operations | < 500ms | < 1000ms | 3000ms |

## 🔄 Continuous Testing

### GitHub Actions Integration

```yaml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run dev &
      - run: npx wait-on http://localhost:3001/api/health
      - run: npx newman run postman/LabSync-API-Collection.json \
              -e postman/LabSync-Environment.json \
              --reporters cli,json \
              --reporter-json-export results.json
```

### Newman CLI

Run tests from command line:
```bash
# Install Newman
npm install -g newman

# Run collection
newman run LabSync-API-Collection.json \
  -e LabSync-Environment.json \
  --iteration-count 1 \
  --reporters cli,html \
  --reporter-html-export test-results.html
```

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [Newman CLI Guide](https://github.com/postmanlabs/newman)
- [API Best Practices](./API-ENHANCEMENTS.md)
- [Test Data Generator](./test-data-generator.js)

## 🤝 Contributing

To add new endpoints to the collection:

1. Create new request in appropriate folder
2. Add pre-request script if needed
3. Add comprehensive test scripts
4. Document any new environment variables
5. Update this README with changes
6. Export and commit updated collection

## 📝 License

This Postman collection is part of the LabSync project and follows the same license terms.