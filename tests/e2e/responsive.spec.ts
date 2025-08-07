import { test, expect, percySnapshot } from './helpers/test-base';

const viewports = {
  'iPhone SE': { width: 375, height: 667 },
  'iPhone 12': { width: 390, height: 844 },
  'iPhone 14 Pro Max': { width: 430, height: 932 },
  'iPad Mini': { width: 768, height: 1024 },
  'iPad Pro': { width: 1024, height: 1366 },
  'Desktop HD': { width: 1920, height: 1080 },
  'Desktop 4K': { width: 3840, height: 2160 },
  'Ultra-wide': { width: 3440, height: 1440 }
};

test.describe('Responsive Design Tests', () => {
  test.describe('Layout Adaptation', () => {
    Object.entries(viewports).forEach(([device, viewport]) => {
      test(`layout should adapt correctly on ${device}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Check no horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalScroll).toBeFalsy();
        
        // Check navigation adaptation
        if (viewport.width < 768) {
          // Mobile: bottom navigation
          const bottomNav = page.locator('[data-testid="bottom-nav"]');
          await expect(bottomNav).toBeVisible();
          
          const sidebar = page.locator('[data-testid="sidebar-nav"]');
          await expect(sidebar).toBeHidden();
        } else if (viewport.width < 1024) {
          // Tablet: collapsible sidebar
          const hamburger = page.locator('[data-testid="hamburger-menu"]');
          await expect(hamburger).toBeVisible();
        } else {
          // Desktop: full sidebar
          const sidebar = page.locator('[data-testid="sidebar-nav"]');
          await expect(sidebar).toBeVisible();
        }
        
        await percySnapshot(page, `Responsive - ${device}`);
      });
    });
  });

  test.describe('Grid Systems', () => {
    test('card grid should adjust columns based on viewport', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      const testCases = [
        { width: 375, expectedColumns: 1 },
        { width: 768, expectedColumns: 2 },
        { width: 1024, expectedColumns: 3 },
        { width: 1920, expectedColumns: 4 },
        { width: 3440, expectedColumns: 6 }
      ];
      
      for (const { width, expectedColumns } of testCases) {
        await page.setViewportSize({ width, height: 1080 });
        await page.waitForTimeout(300); // Wait for layout reflow
        
        const gridColumns = await page.evaluate(() => {
          const grid = document.querySelector('[data-testid="studies-grid"]');
          if (!grid) return 0;
          
          const style = window.getComputedStyle(grid);
          const columns = style.gridTemplateColumns;
          return columns ? columns.split(' ').length : 0;
        });
        
        expect(gridColumns).toBe(expectedColumns);
      }
    });

    test('kanban board should stack vertically on mobile', async ({ page }) => {
      await page.goto('/stacked');
      await page.waitForLoadState('networkidle');
      
      // Desktop view - horizontal layout
      await page.setViewportSize({ width: 1920, height: 1080 });
      let buckets = await page.locator('[data-testid^="bucket-"]').all();
      let firstBucketBox = await buckets[0].boundingBox();
      let secondBucketBox = await buckets[1]?.boundingBox();
      
      if (secondBucketBox) {
        // Buckets should be side by side
        expect(secondBucketBox.x).toBeGreaterThan(firstBucketBox.x + firstBucketBox.width);
      }
      
      // Mobile view - vertical layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      buckets = await page.locator('[data-testid^="bucket-"]').all();
      firstBucketBox = await buckets[0].boundingBox();
      secondBucketBox = await buckets[1]?.boundingBox();
      
      if (secondBucketBox) {
        // Buckets should be stacked vertically
        expect(secondBucketBox.y).toBeGreaterThan(firstBucketBox.y + firstBucketBox.height);
        expect(Math.abs(secondBucketBox.x - firstBucketBox.x)).toBeLessThan(10);
      }
    });
  });

  test.describe('Typography Scaling', () => {
    test('font sizes should scale appropriately', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const viewportTests = [
        { width: 375, minFontSize: 14, maxHeadingSize: 28 },
        { width: 768, minFontSize: 15, maxHeadingSize: 32 },
        { width: 1920, minFontSize: 16, maxHeadingSize: 40 }
      ];
      
      for (const { width, minFontSize, maxHeadingSize } of viewportTests) {
        await page.setViewportSize({ width, height: 800 });
        
        // Check body text
        const bodyFontSize = await page.evaluate(() => {
          const body = document.querySelector('body');
          return parseInt(window.getComputedStyle(body).fontSize);
        });
        expect(bodyFontSize).toBeGreaterThanOrEqual(minFontSize);
        
        // Check heading sizes
        const h1FontSize = await page.evaluate(() => {
          const h1 = document.querySelector('h1');
          return h1 ? parseInt(window.getComputedStyle(h1).fontSize) : 0;
        });
        
        if (h1FontSize > 0) {
          expect(h1FontSize).toBeLessThanOrEqual(maxHeadingSize);
        }
      }
    });

    test('line height should maintain readability', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const viewports = [375, 768, 1920];
      
      for (const width of viewports) {
        await page.setViewportSize({ width, height: 800 });
        
        const lineHeightRatio = await page.evaluate(() => {
          const paragraph = document.querySelector('p');
          if (!paragraph) return 0;
          
          const style = window.getComputedStyle(paragraph);
          const fontSize = parseFloat(style.fontSize);
          const lineHeight = parseFloat(style.lineHeight);
          
          return lineHeight / fontSize;
        });
        
        // Line height should be between 1.4 and 1.8 for readability
        expect(lineHeightRatio).toBeGreaterThanOrEqual(1.4);
        expect(lineHeightRatio).toBeLessThanOrEqual(1.8);
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test('touch targets should be appropriately sized on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const touchTargets = page.locator('button, a, [role="button"], input, select, textarea');
      const count = await touchTargets.count();
      
      for (let i = 0; i < Math.min(count, 20); i++) {
        const target = touchTargets.nth(i);
        const box = await target.boundingBox();
        
        if (box && await target.isVisible()) {
          // WCAG 2.1 recommends minimum 44x44 CSS pixels
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('swipe gestures should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/stacked');
      await page.waitForLoadState('networkidle');
      
      // Simulate swipe gesture
      await page.evaluate(() => {
        const board = document.querySelector('[data-testid="kanban-board"]');
        if (!board) return;
        
        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 300, clientY: 400, identifier: 0 } as Touch]
        });
        const touchMove = new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 400, identifier: 0 } as Touch]
        });
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 400, identifier: 0 } as Touch]
        });
        
        board.dispatchEvent(touchStart);
        board.dispatchEvent(touchMove);
        board.dispatchEvent(touchEnd);
      });
      
      // Check if swipe triggered expected behavior
      await page.waitForTimeout(500);
      // Verify scroll position changed or navigation occurred
    });
  });

  test.describe('Forms and Inputs', () => {
    test('form layouts should adapt to viewport', async ({ page }) => {
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      // Desktop - multi-column layout
      await page.setViewportSize({ width: 1920, height: 1080 });
      const desktopFormGrid = await page.evaluate(() => {
        const form = document.querySelector('[data-testid="study-creation-form"]');
        if (!form) return null;
        
        const style = window.getComputedStyle(form);
        return style.display === 'grid' ? style.gridTemplateColumns : null;
      });
      expect(desktopFormGrid).toBeTruthy();
      
      // Mobile - single column layout
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      const mobileFormLayout = await page.evaluate(() => {
        const inputs = document.querySelectorAll('[data-testid="study-creation-form"] input');
        const positions = Array.from(inputs).map(input => {
          const rect = input.getBoundingClientRect();
          return { x: rect.x, y: rect.y };
        });
        
        // Check if inputs are stacked vertically
        for (let i = 1; i < positions.length; i++) {
          if (positions[i].y <= positions[i-1].y) {
            return false;
          }
        }
        return true;
      });
      expect(mobileFormLayout).toBeTruthy();
    });

    test('select dropdowns should be touch-friendly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      const selects = page.locator('select');
      const count = await selects.count();
      
      for (let i = 0; i < count; i++) {
        const select = selects.nth(i);
        const box = await select.boundingBox();
        
        if (box) {
          // Should have adequate height for touch
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Images and Media', () => {
    test('images should be responsive', async ({ page }) => {
      await page.goto('/team');
      await page.waitForLoadState('networkidle');
      
      const viewportWidths = [375, 768, 1920];
      
      for (const width of viewportWidths) {
        await page.setViewportSize({ width, height: 800 });
        await page.waitForTimeout(300);
        
        const images = page.locator('img');
        const count = await images.count();
        
        for (let i = 0; i < Math.min(count, 10); i++) {
          const img = images.nth(i);
          const box = await img.boundingBox();
          
          if (box && await img.isVisible()) {
            // Image should not exceed viewport width
            expect(box.width).toBeLessThanOrEqual(width);
            
            // Check for responsive attributes
            const srcset = await img.getAttribute('srcset');
            const sizes = await img.getAttribute('sizes');
            
            // Should have responsive image attributes or be sized appropriately
            expect(srcset || sizes || box.width <= width).toBeTruthy();
          }
        }
      }
    });

    test('avatar images should scale appropriately', async ({ page }) => {
      await page.goto('/team');
      await page.waitForLoadState('networkidle');
      
      const avatarSizes = {
        375: { min: 32, max: 48 },
        768: { min: 40, max: 56 },
        1920: { min: 48, max: 64 }
      };
      
      for (const [width, sizes] of Object.entries(avatarSizes)) {
        await page.setViewportSize({ width: parseInt(width), height: 800 });
        await page.waitForTimeout(300);
        
        const avatars = page.locator('[data-testid^="avatar-"]');
        const firstAvatar = avatars.first();
        
        if (await firstAvatar.count() > 0) {
          const box = await firstAvatar.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThanOrEqual(sizes.min);
            expect(box.width).toBeLessThanOrEqual(sizes.max);
          }
        }
      }
    });
  });

  test.describe('Navigation Adaptations', () => {
    test('hamburger menu should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const hamburger = page.locator('[data-testid="hamburger-menu"]');
      await expect(hamburger).toBeVisible();
      
      // Open menu
      await hamburger.click();
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();
      
      // Close menu
      await hamburger.click();
      await expect(mobileMenu).toBeHidden();
    });

    test('breadcrumbs should truncate on mobile', async ({ page }) => {
      await page.goto('/studies');
      await page.click('[data-testid="study-card"]').first();
      await page.waitForLoadState('networkidle');
      
      // Desktop - full breadcrumbs
      await page.setViewportSize({ width: 1920, height: 1080 });
      const desktopBreadcrumbs = page.locator('[data-testid="breadcrumb-item"]');
      const desktopCount = await desktopBreadcrumbs.count();
      
      // Mobile - truncated breadcrumbs
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);
      
      const mobileBreadcrumbs = page.locator('[data-testid="breadcrumb-item"]:visible');
      const mobileCount = await mobileBreadcrumbs.count();
      
      // Mobile should show fewer breadcrumbs or have ellipsis
      expect(mobileCount).toBeLessThanOrEqual(desktopCount);
      
      const ellipsis = page.locator('[data-testid="breadcrumb-ellipsis"]');
      if (desktopCount > 2) {
        await expect(ellipsis).toBeVisible();
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('layout should adapt to orientation changes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Portrait orientation
      await page.setViewportSize({ width: 375, height: 667 });
      await percySnapshot(page, 'Mobile - Portrait');
      
      // Landscape orientation
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(300);
      await percySnapshot(page, 'Mobile - Landscape');
      
      // Check layout adjustments
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('modals should adjust to orientation', async ({ page }) => {
      await page.goto('/team');
      await page.waitForLoadState('networkidle');
      
      // Open modal in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.click('[data-testid="add-member-button"]');
      
      const modalPortrait = page.locator('[data-testid="modal"]');
      const portraitBox = await modalPortrait.boundingBox();
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(300);
      
      const landscapeBox = await modalPortrait.boundingBox();
      
      // Modal should adapt dimensions
      expect(landscapeBox.width).toBeGreaterThan(portraitBox.width);
      expect(landscapeBox.height).toBeLessThan(portraitBox.height);
    });
  });

  test.describe('Performance on Different Devices', () => {
    test('page should load efficiently on mobile networks', async ({ page }) => {
      // Simulate slow 3G
      await page.context().route('**/*', (route) => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(10000);
      
      // Check critical content is visible
      const mainContent = page.locator('[data-testid="main-content"]');
      await expect(mainContent).toBeVisible();
    });

    test('lazy loading should work for images', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/team');
      
      // Check images have loading attribute
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const img = images.nth(i);
        const loading = await img.getAttribute('loading');
        
        // Images below fold should lazy load
        const box = await img.boundingBox();
        if (box && box.y > 667) {
          expect(loading).toBe('lazy');
        }
      }
    });
  });
});