import {
  setupBrowser,
  closeBrowser,
  getPage,
  navigateTo,
  waitForElement,
  clickElement,
  typeText,
  getElementText
} from '../puppeteer.utils';

describe('Form Component Tests', () => {
  // Setup and teardown
  beforeAll(async () => {
    await setupBrowser();
  });

  afterAll(async () => {
    await closeBrowser();
  });

  beforeEach(async () => {
    // Navigate to a page with form components
    await navigateTo('http://localhost:3000');
    // You may need to navigate to a specific page with forms
  });

  // Input component tests
  describe('Input Component', () => {
    test('Input accepts text and displays correctly', async () => {
      const inputSelector = 'input[type="text"]';
      await waitForElement(inputSelector);
      
      // Type into the input field
      const testText = 'Testing input field';
      await typeText(inputSelector, testText);
      
      // Verify the input has the text we typed
      const page = await getPage();
      const inputValue = await page.$eval(inputSelector, (el) => (el as HTMLInputElement).value);
      expect(inputValue).toBe(testText);
    });
    
    test('Input validation works correctly', async () => {
      // Test for a field with validation (e.g., email)
      const emailInputSelector = 'input[type="email"]';
      await waitForElement(emailInputSelector);
      
      // Type invalid email format
      await typeText(emailInputSelector, 'invalid-email');
      
      // Submit the form or trigger validation
      const submitButtonSelector = 'button[type="submit"]';
      await clickElement(submitButtonSelector);
      
      // Check for validation error message
      const errorSelector = '.error-message'; // Replace with your error message selector
      await waitForElement(errorSelector);
      
      const errorText = await getElementText(errorSelector);
      expect(errorText).toContain('valid email'); // Adjust based on your error message
    });
  });

  // Select component tests
  describe('Select Component', () => {
    test('Select dropdown opens and option can be selected', async () => {
      const selectSelector = '.select-trigger'; // Replace with your select component selector
      await waitForElement(selectSelector);
      
      // Open the dropdown
      await clickElement(selectSelector);
      
      // Wait for dropdown content to appear
      const optionSelector = '.select-option'; // Replace with your option selector
      await waitForElement(optionSelector);
      
      // Click an option
      await clickElement(optionSelector);
      
      // Verify selection
      const selectedText = await getElementText(selectSelector);
      expect(selectedText).not.toBe(''); // Replace with expected selected text
    });
  });

  // Textarea component tests
  describe('Textarea Component', () => {
    test('Textarea accepts multiline text input', async () => {
      const textareaSelector = 'textarea';
      await waitForElement(textareaSelector);
      
      // Type multiline text
      const multilineText = 'First line\nSecond line\nThird line';
      await typeText(textareaSelector, multilineText);
      
      // Verify textarea has correct text
      const page = await getPage();
      const textareaValue = await page.$eval(textareaSelector, (el) => (el as HTMLTextAreaElement).value);
      expect(textareaValue).toBe(multilineText);
    });
    
    test('Textarea resizes correctly', async () => {
      // If your textarea has auto-resize functionality
      const textareaSelector = 'textarea.resize';
      await waitForElement(textareaSelector);
      
      // Get initial height
      const page = await getPage();
      const initialHeight = await page.$eval(textareaSelector, (el) => el.clientHeight);
      
      // Type a lot of content to trigger resize
      const longText = 'a\n'.repeat(10);
      await typeText(textareaSelector, longText);
      
      // Get new height
      const newHeight = await page.$eval(textareaSelector, (el) => el.clientHeight);
      
      // Verify height increased
      expect(newHeight).toBeGreaterThan(initialHeight);
    });
  });
});
