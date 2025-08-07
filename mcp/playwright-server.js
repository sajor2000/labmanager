const { chromium, firefox, webkit } = require('playwright');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'playwright-ui-testing',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.browsers = new Map();
    this.setupHandlers();
  }

  setupHandlers() {
    // Tool: Launch Browser
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'launchBrowser':
          return await this.launchBrowser(args);
        case 'navigateTo':
          return await this.navigateTo(args);
        case 'captureScreenshot':
          return await this.captureScreenshot(args);
        case 'runTest':
          return await this.runTest(args);
        case 'closeBrowser':
          return await this.closeBrowser(args);
        case 'interactWithElement':
          return await this.interactWithElement(args);
        case 'checkAccessibility':
          return await this.checkAccessibility(args);
        case 'measurePerformance':
          return await this.measurePerformance(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Resource: Test Results
    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      
      if (uri.startsWith('test://results/')) {
        return await this.getTestResults(uri);
      }
      
      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  async launchBrowser({ browserType = 'chromium', headless = true, viewport }) {
    let browser;
    
    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch({ headless });
        break;
      case 'firefox':
        browser = await firefox.launch({ headless });
        break;
      case 'webkit':
        browser = await webkit.launch({ headless });
        break;
      default:
        throw new Error(`Unknown browser type: ${browserType}`);
    }

    const context = await browser.newContext({
      viewport: viewport || { width: 1280, height: 720 },
      userAgent: 'MCP Playwright Testing Agent',
    });

    const page = await context.newPage();
    const browserId = `browser-${Date.now()}`;
    
    this.browsers.set(browserId, { browser, context, page });

    return {
      content: [
        {
          type: 'text',
          text: `Browser launched successfully. ID: ${browserId}`,
        },
      ],
      metadata: { browserId },
    };
  }

  async navigateTo({ browserId, url, waitUntil = 'networkidle' }) {
    const browserSession = this.browsers.get(browserId);
    if (!browserSession) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    const { page } = browserSession;
    await page.goto(url, { waitUntil });

    return {
      content: [
        {
          type: 'text',
          text: `Navigated to ${url}`,
        },
      ],
    };
  }

  async captureScreenshot({ browserId, fullPage = false, selector }) {
    const browserSession = this.browsers.get(browserId);
    if (!browserSession) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    const { page } = browserSession;
    let screenshot;

    if (selector) {
      const element = await page.locator(selector);
      screenshot = await element.screenshot();
    } else {
      screenshot = await page.screenshot({ fullPage });
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Screenshot captured successfully',
        },
        {
          type: 'image',
          data: screenshot.toString('base64'),
        },
      ],
    };
  }

  async runTest({ browserId, testScript }) {
    const browserSession = this.browsers.get(browserId);
    if (!browserSession) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    const { page } = browserSession;
    
    try {
      // Execute test script in page context
      const result = await page.evaluate(testScript);
      
      return {
        content: [
          {
            type: 'text',
            text: 'Test executed successfully',
          },
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Test failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async interactWithElement({ browserId, selector, action, value }) {
    const browserSession = this.browsers.get(browserId);
    if (!browserSession) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    const { page } = browserSession;
    const element = page.locator(selector);

    switch (action) {
      case 'click':
        await element.click();
        break;
      case 'fill':
        await element.fill(value);
        break;
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
      case 'press':
        await element.press(value);
        break;
      case 'selectOption':
        await element.selectOption(value);
        break;
      case 'check':
        await element.check();
        break;
      case 'uncheck':
        await element.uncheck();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Action '${action}' performed on element '${selector}'`,
        },
      ],
    };
  }

  async checkAccessibility({ browserId, options = {} }) {
    const browserSession = this.browsers.get(browserId);
    if (!browserSession) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    const { page } = browserSession;
    
    // Inject axe-core
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
    });

    // Run accessibility checks
    const results = await page.evaluate((options) => {
      return new Promise((resolve) => {
        window.axe.run(document, options, (err, results) => {
          if (err) throw err;
          resolve(results);
        });
      });
    }, options);

    return {
      content: [
        {
          type: 'text',
          text: `Accessibility check completed. Violations: ${results.violations.length}`,
        },
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
      metadata: {
        violationCount: results.violations.length,
        passCount: results.passes.length,
      },
    };
  }

  async measurePerformance({ browserId }) {
    const browserSession = this.browsers.get(browserId);
    if (!browserSession) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    const { page } = browserSession;
    
    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        navigation: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        },
        paint: paint.map(entry => ({
          name: entry.name,
          startTime: entry.startTime,
        })),
        memory: performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        } : null,
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: 'Performance metrics collected',
        },
        {
          type: 'text',
          text: JSON.stringify(metrics, null, 2),
        },
      ],
      metadata: metrics,
    };
  }

  async closeBrowser({ browserId }) {
    const browserSession = this.browsers.get(browserId);
    if (!browserSession) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    await browserSession.browser.close();
    this.browsers.delete(browserId);

    return {
      content: [
        {
          type: 'text',
          text: `Browser ${browserId} closed`,
        },
      ],
    };
  }

  async getTestResults(uri) {
    // Parse test result ID from URI
    const resultId = uri.split('/').pop();
    
    // In a real implementation, this would fetch from a database
    const mockResults = {
      passed: 45,
      failed: 2,
      skipped: 3,
      duration: 12500,
      timestamp: new Date().toISOString(),
    };

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(mockResults, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright MCP Server running...');
  }
}

// Start the server
const server = new PlaywrightMCPServer();
server.run().catch(console.error);