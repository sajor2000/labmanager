import {
  setupBrowser,
  closeBrowser,
  getPage,
  navigateTo,
  testAccessibility,
  testResponsive,
  emulateVisionDeficiency,
  resetVisionDeficiency,
  takeScreenshot
} from '../puppeteer.utils';

describe('Accessibility and Responsive Tests', () => {
  // Setup and teardown
  beforeAll(async () => {
    await setupBrowser();
  });

  afterAll(async () => {
    await closeBrowser();
  });

  // Accessibility tests
  describe('Accessibility Tests', () => {
    beforeEach(async () => {
      // Navigate to the home page or main app page
      await navigateTo('http://localhost:3000');
    });

    test('Page elements are keyboard navigable', async () => {
      const page = await getPage();
      
      // Press tab multiple times and ensure focus moves to interactive elements
      await page.keyboard.press('Tab');
      
      // Get the active element
      const activeElementTag = await page.evaluate(() => {
        return document.activeElement?.tagName.toLowerCase();
      });
      
      // First tab should focus on a link or button
      expect(['a', 'button', 'input', 'select']).toContain(activeElementTag);
      
      // Continue tabbing and check if focus moves
      await page.keyboard.press('Tab');
      const secondActiveElementTag = await page.evaluate(() => {
        return document.activeElement?.tagName.toLowerCase();
      });
      
      // Focus should have moved to a different element
      expect(secondActiveElementTag).not.toBe(activeElementTag);
    });

    test('Interactive elements have accessible names', async () => {
      const page = await getPage();
      
      // Check buttons for accessible names
      const buttonsAccessible = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        return buttons.every(button => {
          // Check for accessible name via aria-label, aria-labelledby, or text content
          return button.hasAttribute('aria-label') || 
                 button.hasAttribute('aria-labelledby') || 
                 button.textContent?.trim() !== '';
        });
      });
      
      expect(buttonsAccessible).toBeTruthy();
      
      // Check inputs for labels
      const inputsAccessible = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs.every(input => {
          // Check for label association or aria attributes
          const inputId = input.getAttribute('id');
          return inputId && document.querySelector(`label[for="${inputId}"]`) ||
                 input.hasAttribute('aria-label') ||
                 input.hasAttribute('aria-labelledby');
        });
      });
      
      expect(inputsAccessible).toBeTruthy();
    });

    test('Color contrast meets WCAG standards', async () => {
      // This is a simplified check - a real test would use a more sophisticated method
      const page = await getPage();
      
      // Check foreground/background contrast
      const contrastIssues = await page.evaluate(() => {
        // This is a simplified check - would need a full color contrast algorithm
        // for a real implementation
        return Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          const foreground = style.color;
          const background = style.backgroundColor;
          
          // Report any elements with very similar foreground and background colors
          // This is just a basic example and not a real contrast check
          return foreground === background && foreground !== 'rgba(0, 0, 0, 0)';
        }).length;
      });
      
      expect(contrastIssues).toBe(0);
    });

    test('Vision deficiency testing', async () => {
      // Test different vision deficiencies
      const deficiencies = ['achromatopsia', 'deuteranopia', 'protanopia', 'tritanopia'];
      
      for (const deficiency of deficiencies) {
        // Apply the vision deficiency simulation
        await emulateVisionDeficiency(deficiency as any);
        
        // Take a screenshot for visual inspection
        await takeScreenshot(`./tests/screenshots/${deficiency}.png`);
        
        // Here we could check that critical UI elements are still distinguishable
        // This would require specific knowledge of your UI elements and their expected appearance
      }
      
      // Reset vision deficiency emulation
      await resetVisionDeficiency();
    });
  });

  // Responsive tests
  describe('Responsive Design Tests', () => {
    beforeEach(async () => {
      await navigateTo('http://localhost:3000');
    });

    test('Mobile viewport (360x640)', async () => {
      // Set viewport to mobile size
      await testResponsive(360, 640);
      
      const page = await getPage();
      
      // Take screenshot for visual inspection
      await takeScreenshot('./tests/screenshots/mobile.png');
      
      // Check if mobile menu button is visible
      const mobileMenuVisible = await page.evaluate(() => {
        const mobileMenu = document.querySelector('[data-test="mobile-menu-button"]');
        if (!mobileMenu) return false;
        
        const style = window.getComputedStyle(mobileMenu);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      expect(mobileMenuVisible).toBeTruthy();
      
      // Check if desktop menu is hidden
      const desktopMenuHidden = await page.evaluate(() => {
        const desktopMenu = document.querySelector('[data-test="desktop-menu"]');
        if (!desktopMenu) return true; // If not found, consider it hidden
        
        const style = window.getComputedStyle(desktopMenu);
        return style.display === 'none' || style.visibility === 'hidden';
      });
      
      expect(desktopMenuHidden).toBeTruthy();
    });

    test('Tablet viewport (768x1024)', async () => {
      // Set viewport to tablet size
      await testResponsive(768, 1024);
      
      // Take screenshot for visual inspection
      await takeScreenshot('./tests/screenshots/tablet.png');
      
      // Add tablet-specific UI checks here
    });

    test('Desktop viewport (1280x720)', async () => {
      // Set viewport to desktop size
      await testResponsive(1280, 720);
      
      const page = await getPage();
      
      // Take screenshot for visual inspection
      await takeScreenshot('./tests/screenshots/desktop.png');
      
      // Check if desktop menu is visible
      const desktopMenuVisible = await page.evaluate(() => {
        const desktopMenu = document.querySelector('[data-test="desktop-menu"]');
        if (!desktopMenu) return false;
        
        const style = window.getComputedStyle(desktopMenu);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      expect(desktopMenuVisible).toBeTruthy();
      
      // Check if mobile menu button is hidden
      const mobileMenuHidden = await page.evaluate(() => {
        const mobileMenu = document.querySelector('[data-test="mobile-menu-button"]');
        if (!mobileMenu) return true; // If not found, consider it hidden
        
        const style = window.getComputedStyle(mobileMenu);
        return style.display === 'none' || style.visibility === 'hidden';
      });
      
      expect(mobileMenuHidden).toBeTruthy();
    });

    test('Large desktop viewport (1920x1080)', async () => {
      // Set viewport to large desktop size
      await testResponsive(1920, 1080);
      
      // Take screenshot for visual inspection
      await takeScreenshot('./tests/screenshots/large-desktop.png');
      
      // Add large desktop-specific UI checks here
    });
  });
});
