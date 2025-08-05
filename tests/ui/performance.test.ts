import {
  setupBrowser,
  closeBrowser,
  getPage,
  navigateTo
} from '../puppeteer.utils';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  // Setup and teardown
  beforeAll(async () => {
    await setupBrowser();
  });

  afterAll(async () => {
    await closeBrowser();
  });

  // Page load performance
  describe('Page Load Performance', () => {
    test('Homepage loads within acceptable time', async () => {
      const page = await getPage();
      
      // Start measuring
      const startTime = performance.now();
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for key elements to be loaded
      await page.waitForSelector('header', { timeout: 10000 });
      await page.waitForSelector('main', { timeout: 10000 });
      
      // End measuring
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Log the load time
      console.log(`Homepage load time: ${loadTime}ms`);
      
      // Assert that load time is under 3 seconds (3000ms)
      expect(loadTime).toBeLessThan(3000);
    });

    test('Dashboard page loads within acceptable time', async () => {
      const page = await getPage();
      
      // Start measuring
      const startTime = performance.now();
      
      // Navigate to dashboard
      await navigateTo('http://localhost:3000/dashboard');
      
      // Wait for key dashboard elements
      await page.waitForSelector('.dashboard-header', { timeout: 10000 });
      await page.waitForSelector('.dashboard-content', { timeout: 10000 });
      
      // End measuring
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Log the load time
      console.log(`Dashboard load time: ${loadTime}ms`);
      
      // Assert that load time is under 4 seconds (4000ms)
      expect(loadTime).toBeLessThan(4000);
    });
  });

  // Resource loading performance
  describe('Resource Loading Performance', () => {
    test('Page has reasonable number of requests', async () => {
      const page = await getPage();
      
      // Enable request interception to count requests
      const requests: any[] = [];
      page.on('request', request => {
        requests.push(request);
      });
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle' as any);
      
      // Count different types of requests
      const jsRequests = requests.filter(req => req.resourceType() === 'script').length;
      const cssRequests = requests.filter(req => req.resourceType() === 'stylesheet').length;
      const imageRequests = requests.filter(req => req.resourceType() === 'image').length;
      
      console.log(`JS requests: ${jsRequests}`);
      console.log(`CSS requests: ${cssRequests}`);
      console.log(`Image requests: ${imageRequests}`);
      
      // Assert reasonable limits
      expect(jsRequests).toBeLessThan(20);
      expect(cssRequests).toBeLessThan(10);
      expect(imageRequests).toBeLessThan(30);
    });

    test('Large assets are properly optimized', async () => {
      const page = await getPage();
      
      // Capture response sizes
      const responses: any[] = [];
      page.on('response', response => {
        const request = response.request();
        if (request.resourceType() === 'image' || request.resourceType() === 'script' || request.resourceType() === 'stylesheet') {
          responses.push({
            url: request.url(),
            size: response.headers()['content-length'],
            type: request.resourceType()
          });
        }
      });
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle' as any);
      
      // Check for oversized assets
      const oversizedAssets = responses.filter(response => {
        if (!response.size) return false;
        const size = parseInt(response.size);
        // Flag assets over 500KB
        return size > 500000;
      });
      
      console.log(`Found ${oversizedAssets.length} oversized assets`);
      oversizedAssets.forEach(asset => {
        console.log(`Oversized asset: ${asset.url} (${asset.size} bytes)`);
      });
      
      // Assert no oversized assets
      expect(oversizedAssets.length).toBe(0);
    });
  });

  // CPU performance
  describe('CPU Performance', () => {
    test('Page rendering does not cause excessive layouts', async () => {
      const page = await getPage();
      
      // Enable metrics collection
      await page.coverage.startJSCoverage();
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle' as any);
      
      // Get performance metrics
      const metrics = await page.metrics();
      
      console.log(`Layout count: ${metrics.LayoutCount}`);
      console.log(`Recalc style count: ${metrics.RecalcStyleCount}`);
      console.log(`Layout duration: ${metrics.LayoutDuration}`);
      console.log(`Recalc style duration: ${metrics.RecalcStyleDuration}`);
      
      // Assert reasonable limits for layout operations
      expect(metrics.LayoutCount).toBeLessThan(50);
      expect(metrics.RecalcStyleCount).toBeLessThan(100);
      expect(metrics.LayoutDuration).toBeLessThan(1); // seconds
      expect(metrics.RecalcStyleDuration).toBeLessThan(1); // seconds
      
      // Stop coverage collection
      await page.coverage.stopJSCoverage();
    });

    test('JavaScript execution time is reasonable', async () => {
      const page = await getPage();
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle' as any);
      
      // Get performance metrics
      const metrics = await page.metrics();
      
      console.log(`Script duration: ${metrics.ScriptDuration} seconds`);
      console.log(`Task duration: ${metrics.TaskDuration} seconds`);
      
      // Assert reasonable limits for script execution
      expect(metrics.ScriptDuration).toBeLessThan(2); // seconds
      expect(metrics.TaskDuration).toBeLessThan(3); // seconds
    });
  });

  // Memory performance
  describe('Memory Performance', () => {
    test('Page does not cause memory leaks', async () => {
      const page = await getPage();
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for page to stabilize
      await page.waitForLoadState('networkidle' as any);
      
      // Get initial memory metrics
      const initialMetrics = await page.metrics();
      const initialHeapUsed = initialMetrics.JSHeapUsedSize;
      
      console.log(`Initial heap used: ${initialHeapUsed} bytes`);
      
      // Perform some interactions that might cause memory issues
      // Navigate away and back multiple times
      for (let i = 0; i < 5; i++) {
        await navigateTo('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle' as any);
        await navigateTo('http://localhost:3000');
        await page.waitForLoadState('networkidle' as any);
      }
      
      // Get final memory metrics
      const finalMetrics = await page.metrics();
      const finalHeapUsed = finalMetrics.JSHeapUsedSize;
      
      console.log(`Final heap used: ${finalHeapUsed} bytes`);
      console.log(`Heap difference: ${finalHeapUsed! - initialHeapUsed!} bytes`);
      
      // Assert that memory usage hasn't grown excessively
      // Allow for some growth but not more than 10MB
      expect(finalHeapUsed! - initialHeapUsed!).toBeLessThan(10000000);
    });
  });

  // Emulated performance testing
  describe('Emulated Performance Testing', () => {
    test('Page performs well under CPU throttling', async () => {
      const page = await getPage();
      
      // Emulate 4x CPU slowdown
      await page.emulateCPUThrottling(4);
      
      // Start measuring
      const startTime = performance.now();
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for key elements
      await page.waitForSelector('header', { timeout: 20000 }); // Increased timeout for throttling
      await page.waitForSelector('main', { timeout: 20000 });
      
      // End measuring
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`Throttled homepage load time: ${loadTime}ms`);
      
      // Assert that even under throttling, load time is acceptable (under 8 seconds)
      expect(loadTime).toBeLessThan(8000);
      
      // Reset CPU throttling
      await page.emulateCPUThrottling(null);
    });

    test('Page performs well on slow network', async () => {
      const page = await getPage();
      
      // Emulate slow 3G network
      await page.emulateNetworkConditions({
        // offline: false, // Not supported in current API
        download: 500 * 1024 / 8, // 500 KB/s
        upload: 500 * 1024 / 8,   // 500 KB/s
        latency: 400             // 400ms latency
      });
      
      // Start measuring
      const startTime = performance.now();
      
      // Navigate to homepage
      await navigateTo('http://localhost:3000');
      
      // Wait for key elements
      await page.waitForSelector('header', { timeout: 30000 }); // Increased timeout for slow network
      await page.waitForSelector('main', { timeout: 30000 });
      
      // End measuring
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.log(`Slow network homepage load time: ${loadTime}ms`);
      
      // Assert that even on slow network, load time is acceptable (under 10 seconds)
      expect(loadTime).toBeLessThan(10000);
      
      // Reset network conditions
      await page.emulateNetworkConditions(null);
    });
  });
});
