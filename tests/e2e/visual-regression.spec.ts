import { test, expect, percySnapshot } from './helpers/test-base';

test.describe('Visual Regression Tests', () => {
  test.describe('Component Visual Tests', () => {
    test('dashboard overview should match visual baseline', async ({ page }) => {
      await page.goto('/overview');
      await page.waitForLoadState('networkidle');
      
      // Wait for all animations to complete
      await page.waitForTimeout(1000);
      
      // Hide dynamic content for consistent snapshots
      await page.evaluate(() => {
        // Hide timestamps
        document.querySelectorAll('[data-testid*="timestamp"]').forEach(el => {
          (el as HTMLElement).textContent = '2024-01-01 00:00:00';
        });
        
        // Hide user-specific content
        document.querySelectorAll('[data-testid*="user-name"]').forEach(el => {
          (el as HTMLElement).textContent = 'Test User';
        });
      });
      
      // Full page snapshot
      await percySnapshot(page, 'Dashboard - Full Page');
      
      // Component-level snapshots
      const metricCards = page.locator('[data-testid="metrics-section"]');
      await percySnapshot(page, 'Dashboard - Metric Cards', {
        scope: await metricCards.elementHandle()
      });
      
      const recentStudies = page.locator('[data-testid="recent-studies"]');
      await percySnapshot(page, 'Dashboard - Recent Studies', {
        scope: await recentStudies.elementHandle()
      });
    });

    test('study cards should maintain consistent styling', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      // Test different card states
      const studyCard = page.locator('[data-testid="study-card"]').first();
      
      // Normal state
      await percySnapshot(page, 'Study Card - Normal', {
        scope: await studyCard.elementHandle()
      });
      
      // Hover state
      await studyCard.hover();
      await page.waitForTimeout(300); // Wait for hover animation
      await percySnapshot(page, 'Study Card - Hover', {
        scope: await studyCard.elementHandle()
      });
      
      // Selected state
      await studyCard.click();
      await percySnapshot(page, 'Study Card - Selected', {
        scope: await studyCard.elementHandle()
      });
    });

    test('forms should have consistent styling', async ({ page }) => {
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      const form = page.locator('[data-testid="study-creation-form"]');
      
      // Empty form
      await percySnapshot(page, 'Study Form - Empty', {
        scope: await form.elementHandle()
      });
      
      // Form with validation errors
      await page.click('[data-testid="submit-button"]');
      await page.waitForTimeout(500);
      await percySnapshot(page, 'Study Form - Validation Errors', {
        scope: await form.elementHandle()
      });
      
      // Form with filled data
      await page.fill('[data-testid="study-name-input"]', 'Test Study');
      await page.selectOption('[data-testid="status-select"]', 'Planning');
      await page.selectOption('[data-testid="priority-select"]', 'High');
      await percySnapshot(page, 'Study Form - Filled', {
        scope: await form.elementHandle()
      });
    });

    test('modals should render consistently', async ({ page }) => {
      await page.goto('/team');
      await page.waitForLoadState('networkidle');
      
      // Open add member modal
      await page.click('[data-testid="add-member-button"]');
      await page.waitForTimeout(300); // Wait for modal animation
      
      const modal = page.locator('[data-testid="modal"]');
      await percySnapshot(page, 'Modal - Add Team Member');
      
      // Test modal with backdrop
      await percySnapshot(page, 'Modal - With Backdrop (Full Page)');
    });

    test('data tables should display correctly', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      // Switch to table view
      await page.click('[data-testid="view-table"]');
      await page.waitForTimeout(500);
      
      const table = page.locator('[data-testid="studies-table"]');
      
      // Normal table
      await percySnapshot(page, 'Table - Studies List', {
        scope: await table.elementHandle()
      });
      
      // Sorted table
      await page.click('[data-testid="sort-by-name"]');
      await page.waitForTimeout(300);
      await percySnapshot(page, 'Table - Sorted', {
        scope: await table.elementHandle()
      });
      
      // Filtered table
      await page.fill('[data-testid="table-filter"]', 'Active');
      await page.waitForTimeout(500);
      await percySnapshot(page, 'Table - Filtered', {
        scope: await table.elementHandle()
      });
    });
  });

  test.describe('Theme Consistency', () => {
    test('light theme should be consistent across pages', async ({ page }) => {
      const pages = [
        { path: '/', name: 'Overview' },
        { path: '/studies', name: 'Studies' },
        { path: '/tasks', name: 'Tasks' },
        { path: '/team', name: 'Team' },
        { path: '/ideas', name: 'Ideas' }
      ];
      
      for (const pageInfo of pages) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await percySnapshot(page, `Light Theme - ${pageInfo.name}`);
      }
    });

    test('dark theme should be consistent across pages', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Toggle to dark theme
      await page.click('[data-testid="theme-toggle"]');
      await page.waitForTimeout(500);
      
      const pages = [
        { path: '/', name: 'Overview' },
        { path: '/studies', name: 'Studies' },
        { path: '/tasks', name: 'Tasks' },
        { path: '/team', name: 'Team' },
        { path: '/ideas', name: 'Ideas' }
      ];
      
      for (const pageInfo of pages) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await percySnapshot(page, `Dark Theme - ${pageInfo.name}`);
      }
    });
  });

  test.describe('Responsive Visual Tests', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Ultra-wide', width: 3440, height: 1440 }
    ];

    for (const viewport of viewports) {
      test(`dashboard should render correctly at ${viewport.name} resolution`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/overview');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await percySnapshot(page, `Dashboard - ${viewport.name}`);
      });

      test(`kanban board should adapt to ${viewport.name} resolution`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/stacked');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await percySnapshot(page, `Kanban Board - ${viewport.name}`);
      });
    }
  });

  test.describe('Animation and Transition Tests', () => {
    test('page transitions should be smooth', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Capture before navigation
      await percySnapshot(page, 'Navigation - Before');
      
      // Navigate and capture mid-transition
      const navigationPromise = page.click('[data-testid="nav-studies"]');
      await page.waitForTimeout(150); // Mid-transition
      await percySnapshot(page, 'Navigation - During Transition');
      
      await navigationPromise;
      await page.waitForLoadState('networkidle');
      await percySnapshot(page, 'Navigation - After');
    });

    test('dropdown animations should be consistent', async ({ page }) => {
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      const dropdown = page.locator('[data-testid="status-select"]');
      
      // Closed state
      await percySnapshot(page, 'Dropdown - Closed', {
        scope: await dropdown.elementHandle()
      });
      
      // Opening animation
      await dropdown.click();
      await page.waitForTimeout(150);
      await percySnapshot(page, 'Dropdown - Opening', {
        scope: await dropdown.elementHandle()
      });
      
      // Fully open
      await page.waitForTimeout(300);
      await percySnapshot(page, 'Dropdown - Open', {
        scope: await dropdown.elementHandle()
      });
    });
  });

  test.describe('Error State Visual Tests', () => {
    test('empty states should display correctly', async ({ page }) => {
      // Mock empty data
      await page.route('**/api/studies', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ studies: [] })
        });
      });
      
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      await percySnapshot(page, 'Empty State - Studies');
    });

    test('error states should display correctly', async ({ page }) => {
      // Mock error response
      await page.route('**/api/studies', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      await percySnapshot(page, 'Error State - Studies');
    });

    test('loading states should display correctly', async ({ page }) => {
      // Delay API response to capture loading state
      await page.route('**/api/studies', async (route) => {
        await page.waitForTimeout(2000);
        route.continue();
      });
      
      await page.goto('/studies');
      await page.waitForTimeout(500); // Capture during loading
      
      await percySnapshot(page, 'Loading State - Studies');
    });
  });
});