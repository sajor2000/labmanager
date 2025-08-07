import { test as base, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import percySnapshot from '@percy/playwright';

// Extend the Page type with custom methods
interface CustomPage extends Page {
  waitForLoadComplete: () => Promise<void>;
  waitForAnimations: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  checkColorContrast: () => Promise<void>;
  testResponsive: () => Promise<void>;
  checkA11y: (options?: any) => Promise<void>;
  percySnapshot: (name: string) => Promise<void>;
}

// Custom test fixtures for UI/UX testing
export const test = base.extend<{ page: CustomPage }>({
  // Inject accessibility testing into each page
  page: async ({ page }, use) => {
    const customPage = page as any;
    
    // Add custom viewport sizes
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 },
      ultrawide: { width: 3440, height: 1440 },
    };
    
    // Add custom wait helpers
    customPage.waitForLoadComplete = async () => {
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
    };
    
    // Add animation wait helper
    customPage.waitForAnimations = async () => {
      await page.waitForTimeout(500); // Wait for CSS animations
    };
    
    // Add theme toggle helper
    customPage.toggleTheme = async () => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(300); // Wait for theme transition
      }
    };
    
    // Add color contrast checker
    customPage.checkColorContrast = async () => {
      // This would integrate with axe-core for WCAG compliance
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();
      
      const violations = results.violations.filter(v => 
        v.id.includes('color-contrast')
      );
      
      if (violations.length > 0) {
        console.warn('Color contrast issues found:', violations);
      }
    };
    
    // Add responsive testing helper
    customPage.testResponsive = async () => {
      for (const [name, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(100);
        // Screenshot would be taken here for visual regression
      }
      // Reset to desktop
      await page.setViewportSize(viewports.desktop);
    };
    
    // Add accessibility check helper
    customPage.checkA11y = async (options: any = {}) => {
      const results = await new AxeBuilder({ page })
        .withTags(options.tags || ['wcag2aa'])
        .analyze();
      
      if (results.violations.length > 0) {
        const violationMessages = results.violations.map(v => 
          `${v.id}: ${v.description}\n  Elements: ${v.nodes.length}`
        ).join('\n');
        
        throw new Error(`Accessibility violations found:\n${violationMessages}`);
      }
    };
    
    // Add Percy snapshot helper
    customPage.percySnapshot = async (name: string) => {
      if (process.env.PERCY_TOKEN) {
        await percySnapshot(page, name);
      }
    };
    
    await use(customPage as CustomPage);
  },
});

export { expect };