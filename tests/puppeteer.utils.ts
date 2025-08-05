import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';

// Store browser state globally for reuse across tests
let browser: Browser | null = null;
let page: Page | null = null;

// Setup browser with appropriate options
export const setupBrowser = async (): Promise<void> => {
  const isCI = process.env.CI === 'true';
  
  browser = await puppeteer.launch({
    headless: isCI ? true : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 1280,
      height: 800
    }
  });
  
  page = await browser.newPage();
  
  // Set a longer default timeout
  page.setDefaultTimeout(10000);
};

// Close browser
export const closeBrowser = async (): Promise<void> => {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
};

// Get current page
export const getPage = async (): Promise<Page> => {
  if (!page) {
    throw new Error('Browser not initialized. Call setupBrowser() first.');
  }
  return page;
};

// Navigate to a URL
export const navigateTo = async (url: string): Promise<void> => {
  const page = await getPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
};

// Wait for an element to be visible
export const waitForElement = async (selector: string, timeout = 5000): Promise<void> => {
  const page = await getPage();
  await page.waitForSelector(selector, { visible: true, timeout });
};

// Click on an element
export const clickElement = async (selector: string): Promise<void> => {
  const page = await getPage();
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector);
};

// Type text into an element
export const typeText = async (selector: string, text: string): Promise<void> => {
  const page = await getPage();
  await page.waitForSelector(selector, { visible: true });
  await page.type(selector, text);
};

// Check if element is visible
export const isElementVisible = async (selector: string): Promise<boolean> => {
  const page = await getPage();
  try {
    await page.waitForSelector(selector, { visible: true, timeout: 1000 });
    return true;
  } catch (error) {
    return false;
  }
};

// Wait for network idle (alternative to waitForLoadState)
export const waitForNetworkIdle = async (page: Page, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout waiting for network idle'));
    }, timeout);
    
    let inflight = 0;
    let timeoutId2: NodeJS.Timeout;
    
    const onRequestStarted = () => {
      inflight++;
      clearTimeout(timeoutId2);
    };
    
    const onRequestFinished = () => {
      if (inflight === 0) return;
      inflight--;
      if (inflight === 0) {
        timeoutId2 = setTimeout(() => {
          clearTimeout(timeoutId);
          resolve();
        }, 500);
      }
    };
    
    page.on('request', onRequestStarted);
    page.on('requestfinished', onRequestFinished);
    page.on('requestfailed', onRequestFinished);
    
    // Initial check
    timeoutId2 = setTimeout(() => {
      if (inflight === 0) {
        clearTimeout(timeoutId);
        resolve();
      }
    }, 500);
  });
};

// Get text from an element
export const getElementText = async (selector: string): Promise<string> => {
  const page = await getPage();
  await page.waitForSelector(selector, { visible: true });
  return page.$eval(selector, (el) => el.textContent?.trim() || '');
};

// Take a screenshot and save to file
export const takeScreenshot = async (filename: string): Promise<void> => {
  const page = await getPage();
  const screenshotsDir = path.join(__dirname, 'screenshots');
  
  // Ensure screenshots directory exists
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Ensure filename has a proper extension
  let finalFilename = filename;
  if (!filename.match(/\.(png|jpeg|webp)$/i)) {
    finalFilename = `${filename}.png`;
  }
  
  const fullPath = path.join(screenshotsDir, finalFilename) as `${string}.png` | `${string}.jpeg` | `${string}.webp`;
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`Screenshot saved to ${fullPath}`);
};

// Test accessibility features
export const testAccessibility = async (): Promise<void> => {
  const page = await getPage();
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  
  // You can extend this with more comprehensive accessibility testing
};

// Test responsive behavior
export const testResponsive = async (width: number, height: number): Promise<void> => {
  const page = await getPage();
  await page.setViewport({ width, height });
};

// Emulate different vision deficiencies to test UI
export const emulateVisionDeficiency = async (type: 'achromatopsia' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'blurredVision' | 'none'): Promise<void> => {
  const page = await getPage();
  await page.emulateVisionDeficiency(type);
};

// Reset any vision deficiency emulation
export const resetVisionDeficiency = async (): Promise<void> => {
  const page = await getPage();
  await page.emulateVisionDeficiency('none');
};
