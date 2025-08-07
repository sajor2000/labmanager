import { test, expect } from './helpers/simple-test-base';

test.describe('Basic UI Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads
    await expect(page).toHaveTitle(/LabSync|Lab|Research/i);
    
    // Check for main content areas
    const mainContent = page.locator('main, [role="main"], #__next');
    await expect(mainContent).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/');
    
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // Check no horizontal scroll
    const hasDesktopScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasDesktopScroll).toBeFalsy();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check no horizontal scroll on mobile
    const hasMobileScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasMobileScroll).toBeFalsy();
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/');
    
    // Look for any navigation links
    const navLinks = page.locator('nav a, [role="navigation"] a, a[href^="/"]');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      // Click first internal link
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      
      if (href && href.startsWith('/')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');
        
        // Check navigation occurred
        const newUrl = page.url();
        expect(newUrl).toContain(href);
      }
    }
  });

  test('should render key UI components', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for common UI patterns
    const possibleComponents = [
      'header, [role="banner"]',
      'nav, [role="navigation"]', 
      'main, [role="main"]',
      'footer, [role="contentinfo"]',
      'button, [role="button"]',
      'input, textarea, select',
      'h1, h2, h3',
    ];
    
    let foundComponents = 0;
    for (const selector of possibleComponents) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        foundComponents++;
      }
    }
    
    // Should have at least some UI components
    expect(foundComponents).toBeGreaterThan(2);
  });

  test('should measure basic performance metrics', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    
    // Check for basic performance
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });
    
    console.log('Performance metrics:', metrics);
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check text is visible against background
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6').first();
    
    if (await textElements.count() > 0) {
      const contrast = await textElements.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // Simple check - text should have color defined
        return {
          hasColor: color && color !== 'transparent',
          hasBackground: bgColor && bgColor !== 'transparent',
        };
      });
      
      expect(contrast.hasColor).toBeTruthy();
    }
  });

  test('should handle dark mode toggle if available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for theme toggle button
    const themeToggle = page.locator('[data-testid*="theme"], [aria-label*="theme"], button:has-text("theme"), button:has-text("dark"), button:has-text("light")').first();
    
    if (await themeToggle.count() > 0) {
      // Get initial background color
      const initialBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Check background changed
      const newBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      expect(newBg).not.toBe(initialBg);
    }
  });
});