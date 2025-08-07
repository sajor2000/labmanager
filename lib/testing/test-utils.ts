import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { SessionProvider } from 'next-auth/react';

// Mock session for testing
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'RESEARCH_MEMBER',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock lab context
export const mockLabContext = {
  currentLab: {
    id: 'test-lab-id',
    name: 'Test Lab',
    description: 'Test lab description',
  },
  availableLabs: [
    {
      id: 'test-lab-id',
      name: 'Test Lab',
      description: 'Test lab description',
    },
  ],
  setCurrentLab: jest.fn(),
  isLoading: false,
};

// All providers wrapper
function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider session={mockSession}>
      <SWRConfig
        value={{
          dedupingInterval: 0,
          fetcher: () => Promise.resolve({}),
          provider: () => new Map(),
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}

// Custom render with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const createMockProject = (overrides = {}) => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'Test project description',
  oraNumber: 'ORA-2024-001',
  status: 'PLANNING',
  priority: 'MEDIUM',
  labId: 'test-lab-id',
  bucketId: 'bucket-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Test task description',
  status: 'TODO',
  priority: 'MEDIUM',
  projectId: 'project-1',
  assigneeId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'RESEARCH_MEMBER',
  avatarUrl: null,
  initials: 'TU',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// API mock helpers
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  });
};

export const mockApiError = (message: string, status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => ({ error: { message } }),
    text: async () => JSON.stringify({ error: { message } }),
    headers: new Headers(),
  });
};

// Wait helpers
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(() => {
    const loadingElements = document.querySelectorAll('[data-testid*="loading"]');
    expect(loadingElements.length).toBe(0);
  });
};

// Mock window methods
export const mockWindowMethod = (method: string, implementation: any) => {
  const original = (window as any)[method];
  
  beforeAll(() => {
    (window as any)[method] = jest.fn(implementation);
  });
  
  afterAll(() => {
    (window as any)[method] = original;
  });
  
  return (window as any)[method];
};

// Database test helpers
export const setupTestDatabase = async () => {
  // Setup test database connection
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
};

export const cleanupTestDatabase = async () => {
  // Cleanup test data
  const { prisma } = await import('@/lib/prisma');
  
  // Delete in order to respect foreign key constraints
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.taskAssignee.deleteMany(),
    prisma.task.deleteMany(),
    prisma.projectMember.deleteMany(),
    prisma.project.deleteMany(),
    prisma.bucket.deleteMany(),
    prisma.labMember.deleteMany(),
    prisma.lab.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

// Performance testing helpers
export const measurePerformance = async (
  name: string,
  fn: () => Promise<void>
) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
  
  return duration;
};

// Accessibility testing helpers
export const checkAccessibility = async (container: HTMLElement) => {
  const { axe, toHaveNoViolations } = await import('jest-axe');
  expect.extend(toHaveNoViolations);
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Form testing helpers
export const fillForm = async (formData: Record<string, string>) => {
  const { fireEvent } = await import('@testing-library/react');
  
  for (const [name, value] of Object.entries(formData)) {
    const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value } });
    }
  }
};

export const submitForm = async (formElement: HTMLFormElement) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.submit(formElement);
  await waitForAsync();
};

// API testing helpers
export const createMockApiContext = () => {
  const mockFetch = jest.fn();
  
  beforeAll(() => {
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    mockFetch.mockClear();
  });
  
  afterAll(() => {
    global.fetch = fetch;
  });
  
  return mockFetch;
};

// Component testing helpers
export const renderWithRouter = (
  ui: ReactElement,
  { route = '/', ...options } = {}
) => {
  window.history.pushState({}, 'Test page', route);
  return customRender(ui, options);
};

// Snapshot testing helpers
export const createStableSnapshot = (component: any) => {
  // Remove dynamic values for stable snapshots
  const stable = JSON.parse(JSON.stringify(component));
  
  const removeDynamicValues = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
        obj[key] = '[DYNAMIC]';
      } else if (typeof obj[key] === 'object') {
        obj[key] = removeDynamicValues(obj[key]);
      }
    }
    
    return obj;
  };
  
  return removeDynamicValues(stable);
};

// Error boundary testing
export const expectErrorBoundary = async (fn: () => void) => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  expect(fn).toThrow();
  
  spy.mockRestore();
};

// Export test data generators
export const TestDataGenerator = {
  projects: (count: number) => 
    Array.from({ length: count }, (_, i) => 
      createMockProject({ id: `project-${i}`, name: `Project ${i}` })
    ),
    
  tasks: (count: number, projectId: string) =>
    Array.from({ length: count }, (_, i) =>
      createMockTask({ 
        id: `task-${i}`, 
        title: `Task ${i}`,
        projectId 
      })
    ),
    
  users: (count: number) =>
    Array.from({ length: count }, (_, i) =>
      createMockUser({ 
        id: `user-${i}`, 
        name: `User ${i}`,
        email: `user${i}@example.com` 
      })
    ),
};