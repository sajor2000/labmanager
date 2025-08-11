/**
 * SSR-safe browser API utilities
 * These utilities provide safe access to browser-only APIs that don't exist during SSR
 */

/**
 * Check if code is running in browser environment
 */
export const isBrowser = () => typeof window !== 'undefined';

/**
 * Check if code is running on server (SSR)
 */
export const isServer = () => typeof window === 'undefined';

/**
 * Safe localStorage wrapper that works during SSR
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage.getItem error:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage.setItem error:', error);
    }
  },

  removeItem: (key: string): void => {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage.removeItem error:', error);
    }
  },

  clear: (): void => {
    if (!isBrowser()) return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('localStorage.clear error:', error);
    }
  }
};

/**
 * Safe sessionStorage wrapper that works during SSR
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('sessionStorage.getItem error:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (!isBrowser()) return;
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('sessionStorage.setItem error:', error);
    }
  },

  removeItem: (key: string): void => {
    if (!isBrowser()) return;
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('sessionStorage.removeItem error:', error);
    }
  },

  clear: (): void => {
    if (!isBrowser()) return;
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('sessionStorage.clear error:', error);
    }
  }
};

/**
 * Safe document access
 */
export const safeDocument = {
  getElementById: (id: string): HTMLElement | null => {
    if (!isBrowser()) return null;
    return document.getElementById(id);
  },

  querySelector: <T extends Element = Element>(selector: string): T | null => {
    if (!isBrowser()) return null;
    return document.querySelector<T>(selector);
  },

  querySelectorAll: <T extends Element = Element>(selector: string): NodeListOf<T> | [] => {
    if (!isBrowser()) return [] as any;
    return document.querySelectorAll<T>(selector);
  },

  createElement: <K extends keyof HTMLElementTagNameMap>(
    tagName: K
  ): HTMLElementTagNameMap[K] | null => {
    if (!isBrowser()) return null;
    return document.createElement(tagName);
  },

  addEventListener: (
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void => {
    if (!isBrowser()) return;
    document.addEventListener(type, listener, options);
  },

  removeEventListener: (
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions
  ): void => {
    if (!isBrowser()) return;
    document.removeEventListener(type, listener, options);
  },

  body: {
    appendChild: (node: Node): void => {
      if (!isBrowser() || !document.body) return;
      document.body.appendChild(node);
    },
    removeChild: (node: Node): void => {
      if (!isBrowser() || !document.body) return;
      try {
        document.body.removeChild(node);
      } catch (error) {
        console.error('Failed to remove child:', error);
      }
    }
  }
};

/**
 * Safe window access
 */
export const safeWindow = {
  addEventListener: (
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void => {
    if (!isBrowser()) return;
    window.addEventListener(type, listener, options);
  },

  removeEventListener: (
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions
  ): void => {
    if (!isBrowser()) return;
    window.removeEventListener(type, listener, options);
  },

  dispatchEvent: (event: Event): boolean => {
    if (!isBrowser()) return false;
    return window.dispatchEvent(event);
  },

  location: {
    get href(): string {
      if (!isBrowser()) return '';
      return window.location.href;
    },
    get pathname(): string {
      if (!isBrowser()) return '';
      return window.location.pathname;
    },
    get search(): string {
      if (!isBrowser()) return '';
      return window.location.search;
    },
    get hash(): string {
      if (!isBrowser()) return '';
      return window.location.hash;
    }
  },

  URL: {
    createObjectURL: (obj: Blob | MediaSource): string => {
      if (!isBrowser()) return '';
      return URL.createObjectURL(obj);
    },
    revokeObjectURL: (url: string): void => {
      if (!isBrowser()) return;
      URL.revokeObjectURL(url);
    }
  }
};

/**
 * Get theme preference safely (works during SSR)
 */
export const getThemePreference = (): 'light' | 'dark' | null => {
  if (!isBrowser()) return null;
  
  // Check localStorage first
  const stored = safeLocalStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  
  // Check system preference
  if (window.matchMedia) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? 'dark' : 'light';
  }
  
  return 'light'; // Default fallback
};

/**
 * Check if dark mode is enabled (SSR-safe)
 */
export const isDarkMode = (): boolean => {
  if (!isBrowser()) return false;
  return document.documentElement.classList.contains('dark');
};

/**
 * Safe array operations with null checks
 */
export const safeArray = {
  map: <T, R>(
    array: T[] | null | undefined,
    callback: (item: T, index: number, array: T[]) => R,
    fallback: R[] = []
  ): R[] => {
    if (!array || !Array.isArray(array)) return fallback;
    return array.map(callback);
  },

  filter: <T>(
    array: T[] | null | undefined,
    predicate: (item: T, index: number, array: T[]) => boolean,
    fallback: T[] = []
  ): T[] => {
    if (!array || !Array.isArray(array)) return fallback;
    return array.filter(predicate);
  },

  find: <T>(
    array: T[] | null | undefined,
    predicate: (item: T, index: number, array: T[]) => boolean,
    fallback?: T
  ): T | undefined => {
    if (!array || !Array.isArray(array)) return fallback;
    return array.find(predicate);
  },

  reduce: <T, R>(
    array: T[] | null | undefined,
    callback: (acc: R, item: T, index: number, array: T[]) => R,
    initialValue: R
  ): R => {
    if (!array || !Array.isArray(array)) return initialValue;
    return array.reduce(callback, initialValue);
  }
};

/**
 * Safe object property access with fallback
 */
export const safeGet = <T>(
  obj: any,
  path: string,
  fallback?: T
): T | undefined => {
  if (!obj) return fallback;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null) return fallback;
    result = result[key];
  }
  
  return result ?? fallback;
};