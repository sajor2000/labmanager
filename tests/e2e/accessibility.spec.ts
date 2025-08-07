import { test, expect, injectAxe, checkA11y } from './helpers/test-base';
import { AxeResults } from 'axe-core';

test.describe('Accessibility (a11y) Tests', () => {
  test.describe('WCAG 2.1 Compliance', () => {
    test('dashboard should meet WCAG 2.1 AA standards', async ({ page }) => {
      await page.goto('/overview');
      await page.waitForLoadState('networkidle');
      
      await injectAxe(page);
      
      // Check for WCAG 2.1 AA violations
      const violations = await checkA11y(page, undefined, {
        includedImpacts: ['critical', 'serious', 'moderate'],
        detailedReport: true,
        detailedReportOptions: {
          html: true
        },
        rules: {
          'color-contrast': { enabled: true },
          'label': { enabled: true },
          'aria-roles': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'link-name': { enabled: true },
          'list': { enabled: true },
          'listitem': { enabled: true },
          'meta-viewport': { enabled: true },
          'region': { enabled: true }
        }
      });
      
      expect(violations).toBeNull();
    });

    test('forms should have proper labels and ARIA attributes', async ({ page }) => {
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      // Check all form inputs have labels
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        
        // Check for associated label
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');
          
          // Input should have either a label, aria-label, or aria-labelledby
          const hasLabel = await label.count() > 0;
          const hasAriaLabel = ariaLabel !== null;
          const hasAriaLabelledby = ariaLabelledby !== null;
          
          expect(hasLabel || hasAriaLabel || hasAriaLabelledby).toBeTruthy();
        }
        
        // Check for required field indicators
        const isRequired = await input.getAttribute('required');
        if (isRequired !== null) {
          const ariaRequired = await input.getAttribute('aria-required');
          expect(ariaRequired).toBe('true');
        }
      }
      
      await injectAxe(page);
      const violations = await checkA11y(page, '[data-testid="study-creation-form"]');
      expect(violations).toBeNull();
    });

    test('modals should trap focus and be keyboard navigable', async ({ page }) => {
      await page.goto('/team');
      await page.waitForLoadState('networkidle');
      
      // Open modal
      await page.click('[data-testid="add-member-button"]');
      await page.waitForTimeout(300);
      
      // Check modal has proper ARIA attributes
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal).toHaveAttribute('aria-modal', 'true');
      await expect(modal).toHaveAttribute('aria-labelledby', /.+/);
      
      // Test focus trap
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Tab through all focusable elements
      const focusableElements = await modal.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').count();
      
      for (let i = 0; i < focusableElements + 1; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Focus should wrap back to first element
      const currentFocus = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(currentFocus).toBeTruthy();
      
      // Test Escape key closes modal
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('entire application should be keyboard navigable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Start from body
      await page.locator('body').focus();
      
      // Tab through main navigation
      const navItems = page.locator('[data-testid^="nav-"]');
      const navCount = await navItems.count();
      
      for (let i = 0; i < navCount; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
        expect(focused).toContain('nav-');
      }
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Should navigate to new page
      const url = page.url();
      expect(url).not.toContain('overview');
    });

    test('dropdown menus should be keyboard accessible', async ({ page }) => {
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      const dropdown = page.locator('[data-testid="status-select"]');
      await dropdown.focus();
      
      // Open with Enter or Space
      await page.keyboard.press('Enter');
      const options = page.locator('[role="option"]');
      await expect(options.first()).toBeVisible();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Select with Enter
      await page.keyboard.press('Enter');
      
      // Dropdown should close and value should be selected
      await expect(options.first()).toBeHidden();
      const selectedValue = await dropdown.inputValue();
      expect(selectedValue).toBeTruthy();
    });

    test('data tables should support keyboard navigation', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      // Switch to table view
      await page.click('[data-testid="view-table"]');
      await page.waitForTimeout(500);
      
      const table = page.locator('[data-testid="studies-table"]');
      await table.focus();
      
      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      
      // Check cell focus
      const focusedCell = await page.evaluate(() => {
        const focused = document.activeElement;
        return focused?.getAttribute('role') === 'cell' || focused?.closest('[role="cell"]') !== null;
      });
      expect(focusedCell).toBeTruthy();
      
      // Test row selection with Space
      await page.keyboard.press('Space');
      const selectedRow = page.locator('[aria-selected="true"]');
      await expect(selectedRow).toBeVisible();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('page should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Get all headings
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) => {
        return elements.map(el => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent?.trim()
        }));
      });
      
      // Check there's exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);
      
      // Check heading hierarchy is not skipped
      let previousLevel = 0;
      for (const heading of headings) {
        if (previousLevel > 0) {
          expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
        }
        previousLevel = heading.level;
      }
    });

    test('images should have alt text', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const isDecorative = await img.getAttribute('role') === 'presentation';
        
        // Image should have alt text or be marked as decorative
        expect(alt !== null || isDecorative).toBeTruthy();
        
        // If not decorative, alt text should be meaningful
        if (!isDecorative && alt) {
          expect(alt.length).toBeGreaterThan(0);
          expect(alt).not.toMatch(/^image\d+$/i); // Not generic
        }
      }
    });

    test('ARIA live regions should announce updates', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      // Check for ARIA live regions
      const liveRegions = page.locator('[aria-live]');
      const liveRegionCount = await liveRegions.count();
      expect(liveRegionCount).toBeGreaterThan(0);
      
      // Trigger an action that updates live region
      await page.click('[data-testid="add-study-button"]');
      
      // Check live region was updated
      const statusRegion = page.locator('[role="status"]');
      await expect(statusRegion).toContainText(/.+/);
    });

    test('landmarks should be properly defined', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for main landmarks
      const landmarks = {
        banner: page.locator('[role="banner"], header'),
        navigation: page.locator('[role="navigation"], nav'),
        main: page.locator('[role="main"], main'),
        contentinfo: page.locator('[role="contentinfo"], footer')
      };
      
      for (const [name, locator] of Object.entries(landmarks)) {
        const count = await locator.count();
        expect(count).toBeGreaterThan(0);
        
        // Each landmark should have accessible name
        if (count > 1) {
          for (let i = 0; i < count; i++) {
            const element = locator.nth(i);
            const ariaLabel = await element.getAttribute('aria-label');
            const ariaLabelledby = await element.getAttribute('aria-labelledby');
            expect(ariaLabel || ariaLabelledby).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('text should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await injectAxe(page);
      
      // Specifically check color contrast
      const violations = await checkA11y(page, undefined, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(violations).toBeNull();
    });

    test('focus indicators should be visible', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      // Check focus indicator is visible
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const focusStyles = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el as Element);
        return {
          outline: styles.outline,
          boxShadow: styles.boxShadow,
          border: styles.border
        };
      }, focusedElement);
      
      // Should have visible focus indicator
      const hasVisibleFocus = 
        focusStyles.outline !== 'none' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.border !== 'none';
      
      expect(hasVisibleFocus).toBeTruthy();
    });

    test('color should not be sole conveyor of information', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      // Check status indicators have text/icons in addition to color
      const statusIndicators = page.locator('[data-testid^="status-"]');
      const statusCount = await statusIndicators.count();
      
      for (let i = 0; i < statusCount; i++) {
        const indicator = statusIndicators.nth(i);
        const text = await indicator.textContent();
        const icon = await indicator.locator('svg, [role="img"]').count();
        
        // Should have text or icon, not just color
        expect(text || icon > 0).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Accessibility', () => {
    test('touch targets should be appropriately sized on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button, a, [role="button"]');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          // WCAG 2.1 requires minimum 44x44 CSS pixels for touch targets
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('zoom should not break layout up to 200%', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Set zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '200%';
      });
      
      await page.waitForTimeout(500);
      
      // Check for horizontal scroll (should not exist)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      expect(hasHorizontalScroll).toBeFalsy();
      
      // Check key elements are still visible
      const navigation = page.locator('[data-testid="sidebar-nav"]');
      const mainContent = page.locator('[data-testid="main-content"]');
      
      await expect(navigation).toBeVisible();
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('form errors should be announced to screen readers', async ({ page }) => {
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      // Submit empty form to trigger errors
      await page.click('[data-testid="submit-button"]');
      await page.waitForTimeout(500);
      
      // Check error messages have proper ARIA
      const errorMessages = page.locator('[role="alert"]');
      const errorCount = await errorMessages.count();
      expect(errorCount).toBeGreaterThan(0);
      
      // Check errors are associated with inputs
      const inputs = page.locator('input[aria-invalid="true"]');
      const invalidCount = await inputs.count();
      expect(invalidCount).toBeGreaterThan(0);
      
      for (let i = 0; i < invalidCount; i++) {
        const input = inputs.nth(i);
        const describedBy = await input.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();
        
        // Check referenced error message exists
        if (describedBy) {
          const errorMessage = page.locator(`#${describedBy}`);
          await expect(errorMessage).toBeVisible();
        }
      }
    });

    test('loading states should be announced', async ({ page }) => {
      await page.goto('/studies');
      
      // Check for loading announcement
      const loadingIndicator = page.locator('[aria-busy="true"], [role="status"]');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      
      // Loading indicator should be hidden or aria-busy should be false
      const ariaBusy = await page.getAttribute('[data-testid="main-content"]', 'aria-busy');
      expect(ariaBusy).not.toBe('true');
    });
  });
});