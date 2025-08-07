import { test, expect, percySnapshot } from './helpers/test-base';

test.describe('Navigation UI/UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('sidebar navigation should be intuitive and accessible', async ({ page }) => {
    // Test sidebar visibility and structure
    const sidebar = page.locator('[data-testid="sidebar-nav"]');
    await expect(sidebar).toBeVisible();
    
    // Check all navigation items are present
    const navItems = [
      { icon: 'Chart', label: 'Overview', path: '/overview' },
      { icon: 'Flask', label: 'Labs', path: '/labs' },
      { icon: 'Folder', label: 'Buckets', path: '/buckets' },
      { icon: 'Beaker', label: 'Studies', path: '/studies' },
      { icon: 'Grid3x3', label: 'Stacked by Bucket', path: '/stacked' },
      { icon: 'Kanban', label: 'Task Board', path: '/tasks' },
      { icon: 'Lightbulb', label: 'Ideas Board', path: '/ideas' },
      { icon: 'Clock', label: 'Deadlines', path: '/deadlines' },
      { icon: 'Users', label: 'Team Members', path: '/team' },
      { icon: 'Mic', label: 'Standups', path: '/standups' }
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(`[data-testid="nav-${item.label.toLowerCase().replace(/\s+/g, '-')}"]`);
      await expect(navLink).toBeVisible();
      
      // Test hover state
      await navLink.hover();
      await expect(navLink).toHaveCSS('background-color', /.+/); // Should have hover background
      
      // Test keyboard navigation
      await navLink.focus();
      await expect(navLink).toBeFocused();
    }
    
    // Take visual snapshot
    await percySnapshot(page, 'Navigation - Sidebar');
  });

  test('mobile navigation should transform to bottom nav', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check sidebar is hidden on mobile
    const sidebar = page.locator('[data-testid="sidebar-nav"]');
    await expect(sidebar).toBeHidden();
    
    // Check bottom navigation is visible
    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).toBeVisible();
    
    // Test swipe gestures
    await page.locator('body').evaluate((el) => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 300 }] as any,
      });
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 50, clientY: 300 }] as any,
      });
      el.dispatchEvent(touchStart);
      el.dispatchEvent(touchEnd);
    });
    
    await percySnapshot(page, 'Navigation - Mobile');
  });

  test('breadcrumbs should show navigation path', async ({ page }) => {
    // Navigate to a deep page
    await page.goto('/studies');
    await page.click('[data-testid="study-card-1"]');
    
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    await expect(breadcrumbs).toBeVisible();
    
    // Check breadcrumb structure
    const crumbs = breadcrumbs.locator('[data-testid="breadcrumb-item"]');
    await expect(crumbs).toHaveCount(3); // Home > Studies > Study Name
    
    // Test breadcrumb navigation
    await crumbs.nth(1).click();
    await expect(page).toHaveURL('/studies');
    
    await percySnapshot(page, 'Navigation - Breadcrumbs');
  });

  test('search should be globally accessible', async ({ page }) => {
    const searchInput = page.locator('[data-testid="global-search"]');
    await expect(searchInput).toBeVisible();
    
    // Test keyboard shortcut
    await page.keyboard.press('Meta+k');
    await expect(searchInput).toBeFocused();
    
    // Test search functionality
    await searchInput.fill('test study');
    await page.waitForTimeout(500); // Debounce delay
    
    const searchResults = page.locator('[data-testid="search-results"]');
    await expect(searchResults).toBeVisible();
    
    // Test result navigation with arrow keys
    await page.keyboard.press('ArrowDown');
    const firstResult = searchResults.locator('[data-testid="search-result-item"]').first();
    await expect(firstResult).toHaveAttribute('aria-selected', 'true');
    
    await percySnapshot(page, 'Navigation - Search');
  });

  test('lab selector should allow quick switching', async ({ page }) => {
    const labSelector = page.locator('[data-testid="lab-selector"]');
    await expect(labSelector).toBeVisible();
    
    // Open dropdown
    await labSelector.click();
    const dropdown = page.locator('[data-testid="lab-dropdown"]');
    await expect(dropdown).toBeVisible();
    
    // Check lab list
    const labs = dropdown.locator('[data-testid="lab-option"]');
    await expect(labs).toHaveCount(3); // Assuming 3 labs
    
    // Test keyboard shortcut
    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
    
    await page.keyboard.press('Meta+l');
    await expect(dropdown).toBeVisible();
    
    // Select a different lab
    await labs.nth(1).click();
    await expect(page).toHaveURL(/\?lab=/);
    
    await percySnapshot(page, 'Navigation - Lab Selector');
  });

  test('user profile dropdown should contain all options', async ({ page }) => {
    const userAvatar = page.locator('[data-testid="user-avatar"]');
    await expect(userAvatar).toBeVisible();
    
    await userAvatar.click();
    const profileMenu = page.locator('[data-testid="profile-menu"]');
    await expect(profileMenu).toBeVisible();
    
    // Check menu items
    const menuItems = [
      'Profile',
      'Settings',
      'Notifications',
      'Help & Support',
      'Sign Out'
    ];
    
    for (const item of menuItems) {
      const menuItem = profileMenu.locator(`text="${item}"`);
      await expect(menuItem).toBeVisible();
    }
    
    await percySnapshot(page, 'Navigation - User Profile');
  });

  test('navigation should maintain state across page refreshes', async ({ page }) => {
    // Navigate to studies page
    await page.click('[data-testid="nav-studies"]');
    await expect(page).toHaveURL('/studies');
    
    // Expand a section
    const filterSection = page.locator('[data-testid="filter-section"]');
    await filterSection.click();
    await expect(filterSection).toHaveAttribute('aria-expanded', 'true');
    
    // Refresh page
    await page.reload();
    
    // Check state is maintained
    await expect(page).toHaveURL('/studies');
    await expect(filterSection).toHaveAttribute('aria-expanded', 'true');
  });

  test('navigation animations should be smooth', async ({ page }) => {
    // Measure navigation transition time
    const startTime = Date.now();
    await page.click('[data-testid="nav-studies"]');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    // Navigation should complete within acceptable time
    expect(endTime - startTime).toBeLessThan(1000);
    
    // Check for smooth transitions
    const content = page.locator('[data-testid="main-content"]');
    await expect(content).toHaveCSS('transition', /all|opacity|transform/);
  });

  test('skip links should be available for keyboard navigation', async ({ page }) => {
    // Focus on skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[data-testid="skip-to-content"]');
    await expect(skipLink).toBeFocused();
    
    // Activate skip link
    await page.keyboard.press('Enter');
    
    // Check focus moved to main content
    const mainContent = page.locator('[data-testid="main-content"]');
    await expect(mainContent).toBeFocused();
  });

  test('navigation should handle errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/navigation', (route) => {
      route.abort();
    });
    
    // Try to navigate
    await page.click('[data-testid="nav-studies"]');
    
    // Check error handling
    const errorMessage = page.locator('[data-testid="navigation-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Unable to load');
    
    // Check retry button
    const retryButton = page.locator('[data-testid="retry-navigation"]');
    await expect(retryButton).toBeVisible();
  });
});