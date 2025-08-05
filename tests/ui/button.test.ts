import { 
  setupBrowser, 
  closeBrowser, 
  getPage,
  navigateTo, 
  waitForElement, 
  clickElement 
} from '../puppeteer.utils';

describe('Button Component Tests', () => {
  // Global setup - runs once before all tests
  beforeAll(async () => {
    await setupBrowser();
  });
  
  // Global teardown - runs once after all tests
  afterAll(async () => {
    await closeBrowser();
  });
  
  // Individual test setup - runs before each test
  beforeEach(async () => {
    // Navigate to a page with the button component
    // You'll need to update this URL to point to a page with the button component
    await navigateTo('http://localhost:3000');
  });
  
  test('Button is visible and clickable', async () => {
    // Replace '.button-selector' with the actual selector for your button
    const buttonSelector = 'button';
    
    // Wait for the button to be visible
    await waitForElement(buttonSelector);
    
    // Get the page instance
    const page = await getPage();
    
    // Click the button
    await clickElement(buttonSelector);
    
    // Verify some expected behavior after clicking
    // This will depend on what your button does
    // For example, if clicking opens a dialog:
    // await waitForElement('.dialog-selector');
  });
  
  test('Button changes state when hovered', async () => {
    // Replace '.button-selector' with the actual selector for your button
    const buttonSelector = 'button';
    
    // Get the page instance
    const page = await getPage();
    
    // Wait for the button to be visible
    await waitForElement(buttonSelector);
    
    // Hover over the button
    await page.hover(buttonSelector);
    
    // Verify button state changes (e.g., style changes)
    // You might need to check computed styles or classes
    const buttonClasses = await page.$eval(buttonSelector, (el) => el.className);
    expect(buttonClasses).toContain('hover'); // Replace 'hover' with your actual hover state class
  });
  
  test('Button is disabled when appropriate', async () => {
    // Replace '.disabled-button-selector' with the actual selector for a disabled button
    const disabledButtonSelector = 'button[disabled]';
    
    // Get the page instance
    const page = await getPage();
    
    // Wait for the disabled button to be visible
    await waitForElement(disabledButtonSelector);
    
    // Verify the button is disabled
    const isDisabled = await page.$eval(disabledButtonSelector, (el) => el.hasAttribute('disabled'));
    expect(isDisabled).toBeTruthy();
    
    // Try to click the disabled button (should have no effect)
    await clickElement(disabledButtonSelector);
    // Verify no action occurred
  });
});
