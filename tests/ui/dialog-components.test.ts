import {
  setupBrowser,
  closeBrowser,
  getPage,
  navigateTo,
  waitForElement,
  clickElement
} from '../puppeteer.utils';

describe('Dialog and Modal Component Tests', () => {
  // Setup and teardown
  beforeAll(async () => {
    await setupBrowser();
  });

  afterAll(async () => {
    await closeBrowser();
  });

  beforeEach(async () => {
    // Navigate to a page with dialog components
    await navigateTo('http://localhost:3000');
  });

  // Dialog component tests
  describe('Dialog Component', () => {
    test('Dialog opens when trigger is clicked', async () => {
      // Find and click dialog trigger
      const dialogTriggerSelector = '[data-test="dialog-trigger"]';
      await waitForElement(dialogTriggerSelector);
      await clickElement(dialogTriggerSelector);
      
      // Verify dialog is visible
      const dialogSelector = '[role="dialog"]';
      await waitForElement(dialogSelector);
      
      const page = await getPage();
      const isDialogVisible = await page.$eval(dialogSelector, el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      expect(isDialogVisible).toBeTruthy();
    });
    
    test('Dialog closes when close button is clicked', async () => {
      // Open the dialog first
      const dialogTriggerSelector = '[data-test="dialog-trigger"]';
      await waitForElement(dialogTriggerSelector);
      await clickElement(dialogTriggerSelector);
      
      // Wait for dialog to be visible
      const dialogSelector = '[role="dialog"]';
      await waitForElement(dialogSelector);
      
      // Find and click close button
      const closeButtonSelector = '[data-test="dialog-close"]';
      await waitForElement(closeButtonSelector);
      await clickElement(closeButtonSelector);
      
      // Verify dialog is no longer visible
      const page = await getPage();
      
      // Wait a bit for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isDialogHidden = await page.evaluate((selector) => {
        const dialog = document.querySelector(selector);
        return !dialog || window.getComputedStyle(dialog).display === 'none';
      }, dialogSelector);
      
      expect(isDialogHidden).toBeTruthy();
    });
    
    test('Dialog closes when clicking outside', async () => {
      // Open the dialog first
      const dialogTriggerSelector = '[data-test="dialog-trigger"]';
      await waitForElement(dialogTriggerSelector);
      await clickElement(dialogTriggerSelector);
      
      // Wait for dialog to be visible
      const dialogSelector = '[role="dialog"]';
      await waitForElement(dialogSelector);
      
      // Click outside the dialog (on the overlay)
      const page = await getPage();
      const dialogDimensions = await page.$eval(dialogSelector, el => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        };
      });
      
      // Click at position outside the dialog
      await page.mouse.click(dialogDimensions.left - 10, dialogDimensions.top - 10);
      
      // Wait a bit for animation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify dialog is no longer visible
      const isDialogHidden = await page.evaluate((selector) => {
        const dialog = document.querySelector(selector);
        return !dialog || window.getComputedStyle(dialog).display === 'none';
      }, dialogSelector);
      
      expect(isDialogHidden).toBeTruthy();
    });
  });

  // Confirmation dialog tests
  describe('Confirmation Dialog Component', () => {
    test('Confirmation dialog shows confirm and cancel buttons', async () => {
      // Find and click confirmation dialog trigger
      const confirmTriggerSelector = '[data-test="confirm-dialog-trigger"]';
      await waitForElement(confirmTriggerSelector);
      await clickElement(confirmTriggerSelector);
      
      // Verify dialog is visible
      const dialogSelector = '[role="alertdialog"]';
      await waitForElement(dialogSelector);
      
      // Check for confirm button
      const confirmButtonSelector = '[data-test="confirm-button"]';
      await waitForElement(confirmButtonSelector);
      
      // Check for cancel button
      const cancelButtonSelector = '[data-test="cancel-button"]';
      await waitForElement(cancelButtonSelector);
    });
    
    test('Confirmation dialog calls correct handlers', async () => {
      // Open confirmation dialog
      const confirmTriggerSelector = '[data-test="confirm-dialog-trigger"]';
      await waitForElement(confirmTriggerSelector);
      await clickElement(confirmTriggerSelector);
      
      // Wait for dialog
      const dialogSelector = '[role="alertdialog"]';
      await waitForElement(dialogSelector);
      
      // Click confirm button
      const confirmButtonSelector = '[data-test="confirm-button"]';
      await waitForElement(confirmButtonSelector);
      await clickElement(confirmButtonSelector);
      
      // Verify confirmation action happened
      // This will depend on your specific implementation
      // For example, checking if an element was deleted
      const page = await getPage();
      await page.waitForSelector('[data-test="confirmation-success"]', {
        timeout: 2000
      }).catch(() => {
        // Element not found, test will fail
      });
      
      const confirmationSuccess = await page.$('[data-test="confirmation-success"]');
      expect(confirmationSuccess).not.toBeNull();
    });
  });

  // Popover component tests
  describe('Popover Component', () => {
    test('Popover opens on trigger click', async () => {
      // Find and click popover trigger
      const popoverTriggerSelector = '[data-test="popover-trigger"]';
      await waitForElement(popoverTriggerSelector);
      await clickElement(popoverTriggerSelector);
      
      // Verify popover is visible
      const popoverContentSelector = '[data-test="popover-content"]';
      await waitForElement(popoverContentSelector);
      
      const page = await getPage();
      const isPopoverVisible = await page.$eval(popoverContentSelector, el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      
      expect(isPopoverVisible).toBeTruthy();
    });
    
    test('Popover closes when clicking outside', async () => {
      // Open the popover first
      const popoverTriggerSelector = '[data-test="popover-trigger"]';
      await waitForElement(popoverTriggerSelector);
      await clickElement(popoverTriggerSelector);
      
      // Wait for popover to be visible
      const popoverContentSelector = '[data-test="popover-content"]';
      await waitForElement(popoverContentSelector);
      
      // Click outside the popover
      const page = await getPage();
      await page.mouse.click(10, 10);
      
      // Wait a bit for animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify popover is no longer visible
      const isPopoverHidden = await page.evaluate((selector) => {
        const popover = document.querySelector(selector);
        return !popover || 
               window.getComputedStyle(popover).display === 'none' || 
               window.getComputedStyle(popover).visibility === 'hidden';
      }, popoverContentSelector);
      
      expect(isPopoverHidden).toBeTruthy();
    });
  });
});
