/**
 * Color System for LabSync - Rush University Medical Center Theme
 * Light Mode: Rush University brand colors (green, gold, blue)
 * Dark Mode: Slack-style muted dark theme with Rush accents
 */

// Rush University Brand Colors
export const RUSH_COLORS = {
  green: {
    DEFAULT: '#2C5234',
    light: '#4A6741',
    dark: '#1C3A28',
  },
  gold: {
    DEFAULT: '#CFB991',
    light: '#E5D4A1',
    dark: '#B8A878',
  },
  blue: {
    DEFAULT: '#1A5F7A',
    light: '#3498DB',
    dark: '#0F3A4D',
  },
} as const;

// Slack Dark Mode Colors
export const SLACK_COLORS = {
  bg: {
    main: '#1A1D21',
    sidebar: '#222529',
    message: '#232528',
    hover: '#2D3136',
    active: '#3A3D41',
  },
  text: {
    primary: '#D1D2D3',
    secondary: '#ABABAD',
  },
  border: '#2C2D30',
} as const;

// Status Colors - Professional Medical Theme
export const STATUS_COLORS = {
  planning: {
    bg: '#E6F0F7',
    text: RUSH_COLORS.blue.DEFAULT,
    border: RUSH_COLORS.blue.light,
    dark: {
      bg: '#1E3A5F',
      text: '#5B9FBD',
      border: '#3A7FA0',
    }
  },
  'irb-submission': {
    bg: '#FFF8E6',
    text: '#B8860B',
    border: '#DAA520',
    dark: {
      bg: '#4A3C00',
      text: '#D4AF37',
      border: '#B8860B',
    }
  },
  'irb-approved': {
    bg: '#E8F0E8',
    text: RUSH_COLORS.green.DEFAULT,
    border: RUSH_COLORS.green.light,
    dark: {
      bg: '#1C3A28',
      text: RUSH_COLORS.green.light,
      border: '#3A5A3A',
    }
  },
  'data-collection': {
    bg: '#E6F0F7',
    text: '#2E7D8E',
    border: '#4A99A9',
    dark: {
      bg: '#1A3A45',
      text: '#4A99A9',
      border: '#3A7A8A',
    }
  },
  analysis: {
    bg: '#EAF0EA',
    text: '#3A5A3A',
    border: '#5A7A5A',
    dark: {
      bg: '#2A4A2A',
      text: '#6A8A6A',
      border: '#4A6A4A',
    }
  },
  manuscript: {
    bg: '#F7F3E9',
    text: RUSH_COLORS.gold.dark,
    border: RUSH_COLORS.gold.DEFAULT,
    dark: {
      bg: '#3A3528',
      text: RUSH_COLORS.gold.light,
      border: RUSH_COLORS.gold.DEFAULT,
    }
  },
  'under-review': {
    bg: '#FFF8E6',
    text: '#B88937',
    border: '#D4A550',
    dark: {
      bg: '#3A3000',
      text: '#D4A550',
      border: '#B88937',
    }
  },
  published: {
    bg: '#E8F5E9',
    text: '#2E5F32',
    border: '#4A7F4E',
    dark: {
      bg: '#1E3F20',
      text: '#5A8F5E',
      border: '#4A7F4E',
    }
  },
  'on-hold': {
    bg: '#F5F5F5',
    text: '#616161',
    border: '#9E9E9E',
    dark: {
      bg: '#2A2A2A',
      text: '#808080',
      border: '#505050',
    }
  },
  cancelled: {
    bg: '#FFEBEE',
    text: '#B71C1C',
    border: '#D32F2F',
    dark: {
      bg: '#3A1C1C',
      text: '#CF6679',
      border: '#B71C1C',
    }
  },
} as const;

// Priority Colors - Medical Professional
export const PRIORITY_COLORS = {
  low: {
    bg: '#F0F4F8',
    text: '#607080',
    icon: '#8090A0',
    dark: {
      bg: '#2A3540',
      text: '#8090A0',
      icon: '#607080',
    }
  },
  medium: {
    bg: '#E6F0F7',
    text: RUSH_COLORS.blue.DEFAULT,
    icon: RUSH_COLORS.blue.light,
    dark: {
      bg: RUSH_COLORS.blue.dark,
      text: RUSH_COLORS.blue.light,
      icon: '#5B9FBD',
    }
  },
  high: {
    bg: '#FFF8E6',
    text: '#B8860B',
    icon: '#DAA520',
    dark: {
      bg: '#4A3C00',
      text: '#DAA520',
      icon: '#B8860B',
    }
  },
  critical: {
    bg: '#FFEBEE',
    text: '#B71C1C',
    icon: '#D32F2F',
    dark: {
      bg: '#3A1C1C',
      text: '#D32F2F',
      icon: '#B71C1C',
    }
  },
} as const;

// Bucket Colors - Professional palette
export const BUCKET_COLORS = [
  RUSH_COLORS.green.DEFAULT,
  RUSH_COLORS.gold.DEFAULT,
  RUSH_COLORS.blue.DEFAULT,
  '#7B68EE', // Medium Slate Blue
  '#20B2AA', // Light Sea Green
  '#CD853F', // Peru
  '#4682B4', // Steel Blue
  '#8B4513', // Saddle Brown
  '#708090', // Slate Gray
  '#B22222', // Fire Brick
] as const;

// UI Semantic Colors
export const SEMANTIC_COLORS = {
  success: {
    light: RUSH_COLORS.green.light,
    main: RUSH_COLORS.green.DEFAULT,
    dark: RUSH_COLORS.green.dark,
  },
  warning: {
    light: '#FFD700',
    main: '#DAA520',
    dark: '#B8860B',
  },
  error: {
    light: '#EF5350',
    main: '#D32F2F',
    dark: '#B71C1C',
  },
  info: {
    light: RUSH_COLORS.blue.light,
    main: RUSH_COLORS.blue.DEFAULT,
    dark: RUSH_COLORS.blue.dark,
  },
} as const;

// Progress Gradient Colors - Rush Theme
export const PROGRESS_GRADIENTS = {
  low: `linear-gradient(135deg, ${RUSH_COLORS.blue.DEFAULT} 0%, ${RUSH_COLORS.blue.light} 100%)`,
  medium: `linear-gradient(135deg, ${RUSH_COLORS.gold.dark} 0%, ${RUSH_COLORS.gold.DEFAULT} 100%)`,
  high: `linear-gradient(135deg, ${RUSH_COLORS.green.dark} 0%, ${RUSH_COLORS.green.DEFAULT} 100%)`,
  complete: `linear-gradient(135deg, ${RUSH_COLORS.green.DEFAULT} 0%, ${RUSH_COLORS.gold.DEFAULT} 100%)`,
} as const;

// Chart Colors - Professional Medical Palette
export const CHART_COLORS = {
  primary: [
    RUSH_COLORS.green.DEFAULT,
    RUSH_COLORS.gold.DEFAULT,
    RUSH_COLORS.blue.DEFAULT,
    '#7B68EE',
    '#20B2AA',
    '#CD853F',
  ],
  secondary: [
    RUSH_COLORS.green.light,
    RUSH_COLORS.gold.light,
    RUSH_COLORS.blue.light,
    '#9370DB',
    '#48D1CC',
    '#DEB887',
  ],
  muted: [
    '#E8F0E8',
    '#F7F3E9',
    '#E6F0F7',
    '#F0E6F7',
    '#E6F7F7',
    '#F7F0E6',
  ],
} as const;

// Helper function to get status color
export function getStatusColor(status: string, isDark: boolean = false) {
  const statusKey = status.toLowerCase().replace(/\s+/g, '-') as keyof typeof STATUS_COLORS;
  const colors = STATUS_COLORS[statusKey];
  
  if (!colors) {
    return isDark 
      ? { bg: '#2A2A2A', text: '#808080', border: '#505050' }
      : { bg: '#F5F5F5', text: '#616161', border: '#E0E0E0' };
  }
  
  return isDark ? colors.dark : colors;
}

// Helper function to get priority color
export function getPriorityColor(priority: string, isDark: boolean = false) {
  const priorityKey = priority.toLowerCase() as keyof typeof PRIORITY_COLORS;
  const colors = PRIORITY_COLORS[priorityKey];
  
  if (!colors) {
    return isDark
      ? { bg: '#2A2A2A', text: '#808080', icon: '#505050' }
      : { bg: '#F5F5F5', text: '#616161', icon: '#9E9E9E' };
  }
  
  return isDark ? colors.dark : colors;
}

// Helper function to get bucket color
export function getBucketColor(index: number): string {
  return BUCKET_COLORS[index % BUCKET_COLORS.length];
}

// Helper function to generate color with opacity
export function colorWithOpacity(color: string, opacity: number): string {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Theme-aware color helper
export function getThemeColor(lightColor: string, darkColor: string, isDark: boolean): string {
  return isDark ? darkColor : lightColor;
}