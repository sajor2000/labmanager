import { test, expect } from './helpers/test-base';
import { PerformanceMonitor } from './helpers/test-base';

test.describe('Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page }) => {
    performanceMonitor = new PerformanceMonitor();
    await performanceMonitor.startMonitoring(page);
  });

  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for LCP to stabilize
      await page.waitForTimeout(2500);
      
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};
            
            entries.forEach((entry: any) => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.renderTime || entry.loadTime;
              } else if (entry.entryType === 'first-input') {
                vitals.fid = entry.processingStart - entry.startTime;
              } else if (entry.entryType === 'layout-shift') {
                vitals.cls = (vitals.cls || 0) + entry.value;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Get FCP from performance.getEntriesByType
          const paintEntries = performance.getEntriesByType('paint');
          const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
          
          setTimeout(() => {
            resolve({
              fcp: fcp?.startTime,
              lcp: 0,
              fid: 0,
              cls: 0
            });
          }, 1000);
        });
      });
      
      // Core Web Vitals thresholds
      if (metrics.fcp) expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
      if (metrics.lcp) expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
      if (metrics.fid) expect(metrics.fid).toBeLessThan(100);  // FID < 100ms
      if (metrics.cls) expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
    });

    test('Time to Interactive (TTI) should be under 3.8s', async ({ page }) => {
      await page.goto('/');
      
      const tti = await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const navEntry = entries.find((entry) => entry.entryType === 'navigation');
              if (navEntry) {
                resolve((navEntry as any).interactive || (navEntry as any).domInteractive);
              }
            });
            observer.observe({ entryTypes: ['navigation'] });
          }
          
          // Fallback
          setTimeout(() => {
            resolve(performance.timing.domInteractive - performance.timing.navigationStart);
          }, 100);
        });
      });
      
      expect(tti).toBeLessThan(3800);
    });

    test('Total Blocking Time (TBT) should be minimal', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const tbt = await page.evaluate(() => {
        let totalBlockingTime = 0;
        const longTasks = performance.getEntriesByType('longtask');
        
        longTasks.forEach((task: any) => {
          const blockingTime = task.duration - 50;
          if (blockingTime > 0) {
            totalBlockingTime += blockingTime;
          }
        });
        
        return totalBlockingTime;
      });
      
      expect(tbt).toBeLessThan(300); // TBT < 300ms
    });
  });

  test.describe('Page Load Performance', () => {
    test('initial page load should be optimized', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const domContentLoadedTime = Date.now() - startTime;
      
      await page.waitForLoadState('networkidle');
      const fullyLoadedTime = Date.now() - startTime;
      
      expect(domContentLoadedTime).toBeLessThan(1500); // DOM ready < 1.5s
      expect(fullyLoadedTime).toBeLessThan(3000); // Fully loaded < 3s
      
      // Check resource counts
      const resourceMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return {
          total: resources.length,
          scripts: resources.filter((r) => r.name.includes('.js')).length,
          stylesheets: resources.filter((r) => r.name.includes('.css')).length,
          images: resources.filter((r) => r.name.match(/\.(png|jpg|jpeg|gif|svg|webp)/)).length,
        };
      });
      
      // Check for reasonable resource counts
      expect(resourceMetrics.scripts).toBeLessThan(20);
      expect(resourceMetrics.stylesheets).toBeLessThan(10);
    });

    test('navigation between pages should be fast', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Measure navigation time
      const navigationTime = await page.evaluate(async () => {
        const startTime = performance.now();
        
        // Click navigation link
        const studiesLink = document.querySelector('[data-testid="nav-studies"]') as HTMLElement;
        studiesLink?.click();
        
        // Wait for navigation
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (window.location.pathname.includes('/studies')) {
              clearInterval(checkInterval);
              resolve(null);
            }
          }, 50);
        });
        
        return performance.now() - startTime;
      });
      
      expect(navigationTime).toBeLessThan(1000); // Navigation < 1s
    });
  });

  test.describe('Bundle Size and Code Splitting', () => {
    test('JavaScript bundle sizes should be optimized', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const jsBundles = await page.evaluate(() => {
        const scripts = performance.getEntriesByType('resource')
          .filter((r) => r.name.includes('.js'));
        
        return scripts.map((script) => ({
          name: script.name.split('/').pop(),
          size: (script as any).transferSize || 0,
          duration: script.duration
        }));
      });
      
      // Check individual bundle sizes
      jsBundles.forEach((bundle) => {
        expect(bundle.size).toBeLessThan(500000); // Each bundle < 500KB
      });
      
      // Check total JS size
      const totalJsSize = jsBundles.reduce((sum, b) => sum + b.size, 0);
      expect(totalJsSize).toBeLessThan(2000000); // Total JS < 2MB
    });

    test('code splitting should work for routes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const initialBundles = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter((r) => r.name.includes('.js'))
          .map((r) => r.name);
      });
      
      // Navigate to a different route
      await page.click('[data-testid="nav-studies"]');
      await page.waitForLoadState('networkidle');
      
      const afterNavBundles = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter((r) => r.name.includes('.js'))
          .map((r) => r.name);
      });
      
      // Check that new bundles were loaded (code splitting is working)
      const newBundles = afterNavBundles.filter((b) => !initialBundles.includes(b));
      expect(newBundles.length).toBeGreaterThan(0);
    });
  });

  test.describe('Runtime Performance', () => {
    test('scrolling should be smooth', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      // Add many items to test scrolling performance
      await page.evaluate(() => {
        const container = document.querySelector('[data-testid="studies-container"]');
        if (container) {
          for (let i = 0; i < 100; i++) {
            const div = document.createElement('div');
            div.style.height = '100px';
            div.textContent = `Item ${i}`;
            container.appendChild(div);
          }
        }
      });
      
      // Measure scroll performance
      const scrollMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          let startTime = performance.now();
          
          const measureFrames = () => {
            frames++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(measureFrames);
            } else {
              resolve(frames);
            }
          };
          
          // Start scrolling
          window.scrollTo({ top: 1000, behavior: 'smooth' });
          measureFrames();
        });
      });
      
      // Should maintain at least 30fps during scroll
      expect(scrollMetrics).toBeGreaterThan(30);
    });

    test('animations should run at 60fps', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Trigger an animation
      await page.click('[data-testid="theme-toggle"]');
      
      const animationMetrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          const startTime = performance.now();
          const duration = 500; // 500ms animation
          
          const countFrames = () => {
            frames++;
            if (performance.now() - startTime < duration) {
              requestAnimationFrame(countFrames);
            } else {
              const fps = (frames / duration) * 1000;
              resolve(fps);
            }
          };
          
          requestAnimationFrame(countFrames);
        });
      });
      
      // Should maintain close to 60fps
      expect(animationMetrics).toBeGreaterThan(50);
    });

    test('interaction responsiveness should be fast', async ({ page }) => {
      await page.goto('/studies/new');
      await page.waitForLoadState('networkidle');
      
      // Measure input latency
      const inputLatency = await page.evaluate(() => {
        return new Promise((resolve) => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (!input) {
            resolve(0);
            return;
          }
          
          let startTime: number;
          
          input.addEventListener('keydown', () => {
            startTime = performance.now();
          });
          
          input.addEventListener('input', () => {
            const latency = performance.now() - startTime;
            resolve(latency);
          });
          
          // Simulate typing
          const event = new KeyboardEvent('keydown', { key: 'a' });
          input.dispatchEvent(event);
          input.value = 'a';
          input.dispatchEvent(new Event('input'));
        });
      });
      
      expect(inputLatency).toBeLessThan(100); // Input latency < 100ms
    });
  });

  test.describe('Memory Management', () => {
    test('memory usage should be reasonable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const initialMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Navigate through several pages
      const pages = ['/studies', '/tasks', '/team', '/ideas'];
      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
      }
      
      // Return to home
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        if ((performance as any).memory) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Memory shouldn't grow significantly
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(10000000); // Less than 10MB growth
    });

    test('should not have memory leaks with repeated actions', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      const measureMemory = async () => {
        return await page.evaluate(() => {
          if ((performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize;
          }
          return 0;
        });
      };
      
      const initialMemory = await measureMemory();
      
      // Perform repeated actions
      for (let i = 0; i < 10; i++) {
        // Open modal
        await page.click('[data-testid="add-study-button"]');
        await page.waitForTimeout(100);
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);
      }
      
      // Check memory after repeated actions
      const finalMemory = await measureMemory();
      const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;
      
      // Memory increase should be less than 50%
      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  test.describe('Network Performance', () => {
    test('API calls should be efficient', async ({ page }) => {
      await page.goto('/studies');
      
      const apiCalls = await page.evaluate(() => {
        return new Promise((resolve) => {
          const calls: any[] = [];
          
          // Intercept fetch
          const originalFetch = window.fetch;
          window.fetch = async (...args) => {
            const startTime = performance.now();
            const response = await originalFetch(...args);
            const duration = performance.now() - startTime;
            
            calls.push({
              url: args[0],
              duration,
              size: parseInt(response.headers.get('content-length') || '0'),
              status: response.status
            });
            
            return response;
          };
          
          setTimeout(() => resolve(calls), 3000);
        });
      });
      
      // Check API call performance
      (apiCalls as any[]).forEach((call) => {
        expect(call.duration).toBeLessThan(1000); // API calls < 1s
        expect(call.status).toBe(200);
      });
    });

    test('should implement proper caching', async ({ page }) => {
      // First load
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const firstLoadResources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map((r) => ({
          name: r.name,
          duration: r.duration,
          cached: (r as any).transferSize === 0
        }));
      });
      
      // Second load (should use cache)
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const secondLoadResources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map((r) => ({
          name: r.name,
          duration: r.duration,
          cached: (r as any).transferSize === 0
        }));
      });
      
      // More resources should be cached on second load
      const firstCached = firstLoadResources.filter((r) => r.cached).length;
      const secondCached = secondLoadResources.filter((r) => r.cached).length;
      
      expect(secondCached).toBeGreaterThan(firstCached);
    });
  });

  test.describe('Component-Specific Performance', () => {
    test('data table should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/studies');
      await page.waitForLoadState('networkidle');
      
      // Switch to table view
      await page.click('[data-testid="view-table"]');
      
      // Add many rows to test performance
      await page.evaluate(() => {
        const table = document.querySelector('[data-testid="studies-table"] tbody');
        if (table) {
          for (let i = 0; i < 1000; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>Study ${i}</td>
              <td>Status ${i % 5}</td>
              <td>PI ${i % 10}</td>
              <td>2024-01-${(i % 28) + 1}</td>
            `;
            table.appendChild(row);
          }
        }
      });
      
      // Measure scroll performance
      const startTime = Date.now();
      await page.evaluate(() => {
        const table = document.querySelector('[data-testid="studies-table"]');
        if (table) {
          table.scrollTop = table.scrollHeight;
        }
      });
      const scrollTime = Date.now() - startTime;
      
      expect(scrollTime).toBeLessThan(100); // Scrolling should be instant
      
      // Measure sort performance
      const sortStart = Date.now();
      await page.click('[data-testid="sort-by-name"]');
      const sortTime = Date.now() - sortStart;
      
      expect(sortTime).toBeLessThan(500); // Sorting should be fast
    });

    test('modals should open quickly', async ({ page }) => {
      await page.goto('/team');
      await page.waitForLoadState('networkidle');
      
      const openTimes: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = await page.evaluate(() => performance.now());
        
        await page.click('[data-testid="add-member-button"]');
        await page.waitForSelector('[data-testid="modal"]', { state: 'visible' });
        
        const endTime = await page.evaluate(() => performance.now());
        openTimes.push(endTime - startTime);
        
        await page.keyboard.press('Escape');
        await page.waitForSelector('[data-testid="modal"]', { state: 'hidden' });
      }
      
      // All modal opens should be fast
      openTimes.forEach((time) => {
        expect(time).toBeLessThan(200); // Modal open < 200ms
      });
      
      // Should not degrade over time
      const avgFirstTwo = (openTimes[0] + openTimes[1]) / 2;
      const avgLastTwo = (openTimes[3] + openTimes[4]) / 2;
      expect(avgLastTwo).toBeLessThan(avgFirstTwo * 1.5); // No significant degradation
    });

    test('drag and drop should be performant', async ({ page }) => {
      await page.goto('/stacked');
      await page.waitForLoadState('networkidle');
      
      const dragPerformance = await page.evaluate(() => {
        return new Promise((resolve) => {
          const card = document.querySelector('[data-testid^="study-card-"]') as HTMLElement;
          const targetBucket = document.querySelectorAll('[data-testid^="bucket-"]')[1] as HTMLElement;
          
          if (!card || !targetBucket) {
            resolve({ fps: 0, duration: 0 });
            return;
          }
          
          let frames = 0;
          const startTime = performance.now();
          
          const countFrames = () => {
            frames++;
            if (performance.now() - startTime < 500) {
              requestAnimationFrame(countFrames);
            }
          };
          
          // Simulate drag
          const dragStart = new DragEvent('dragstart', { bubbles: true });
          const dragOver = new DragEvent('dragover', { bubbles: true });
          const drop = new DragEvent('drop', { bubbles: true });
          
          requestAnimationFrame(countFrames);
          
          card.dispatchEvent(dragStart);
          targetBucket.dispatchEvent(dragOver);
          targetBucket.dispatchEvent(drop);
          
          setTimeout(() => {
            const duration = performance.now() - startTime;
            const fps = (frames / duration) * 1000;
            resolve({ fps, duration });
          }, 500);
        });
      });
      
      expect((dragPerformance as any).fps).toBeGreaterThan(30); // Maintain 30+ fps during drag
    });
  });
});