import { test as base, expect, Page } from '@playwright/test';

// Extend the Page type with custom methods
interface CustomPage extends Page {
  waitForLoadComplete: () => Promise<void>;
  waitForAnimations: () => Promise<void>;
}

// Simplified test base without Percy for initial testing
export const test = base.extend<{ page: CustomPage }>({
  page: async ({ page }, use) => {
    // Cast page to any to add custom methods
    const customPage = page as any;
    
    // Add custom wait helpers
    customPage.waitForLoadComplete = async () => {
      await page.waitForLoadState('networkidle');
      await page.waitForLoadState('domcontentloaded');
    };
    
    // Add animation wait helper
    customPage.waitForAnimations = async () => {
      await page.waitForTimeout(500);
    };
    
    await use(customPage as CustomPage);
  },
});

export { expect };