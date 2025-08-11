'use client';

import React from 'react';
import { 
  Type, Hash, Calendar, Link2, Mail, Phone, 
  DollarSign, Percent, Star, Check, User,
  Tag, Paperclip, MessageSquare, MapPin,
  Clock, BarChart, Calculator, Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type FieldType = 
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'CURRENCY'
  | 'PERCENT'
  | 'DATE'
  | 'DATE_TIME'
  | 'DURATION'
  | 'SINGLE_SELECT'
  | 'MULTI_SELECT'
  | 'SINGLE_USER'
  | 'MULTI_USER'
  | 'CHECKBOX'
  | 'RATING'
  | 'URL'
  | 'EMAIL'
  | 'PHONE'
  | 'ATTACHMENT'
  | 'LOCATION'
  | 'FORMULA'
  | 'ROLLUP'
  | 'LOOKUP'
  | 'BUTTON'
  | 'BARCODE'
  | 'COLLABORATOR'
  | 'LAST_MODIFIED_TIME'
  | 'LAST_MODIFIED_BY'
  | 'CREATED_TIME'
  | 'CREATED_BY'
  | 'AUTO_NUMBER';

export interface FieldDefinition {
  type: FieldType;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: 'basic' | 'advanced' | 'computed' | 'system';
  color: string;
  isPremium?: boolean;
  isNew?: boolean;
  configurable?: boolean;
}

export const FIELD_DEFINITIONS: Record<FieldType, FieldDefinition> = {
  TEXT: {
    type: 'TEXT',
    name: 'Single line text',
    icon: <Type className="h-4 w-4" />,
    description: 'A single line of text',
    category: 'basic',
    color: 'text-gray-500',
    configurable: true,
  },
  LONG_TEXT: {
    type: 'LONG_TEXT',
    name: 'Long text',
    icon: <Type className="h-4 w-4" />,
    description: 'Multiple lines of text with formatting',
    category: 'basic',
    color: 'text-gray-500',
    configurable: true,
  },
  NUMBER: {
    type: 'NUMBER',
    name: 'Number',
    icon: <Hash className="h-4 w-4" />,
    description: 'Integer or decimal number',
    category: 'basic',
    color: 'text-blue-500',
    configurable: true,
  },
  CURRENCY: {
    type: 'CURRENCY',
    name: 'Currency',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Monetary value with currency symbol',
    category: 'basic',
    color: 'text-green-500',
    configurable: true,
  },
  PERCENT: {
    type: 'PERCENT',
    name: 'Percent',
    icon: <Percent className="h-4 w-4" />,
    description: 'Percentage value',
    category: 'basic',
    color: 'text-green-500',
    configurable: true,
  },
  DATE: {
    type: 'DATE',
    name: 'Date',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Date without time',
    category: 'basic',
    color: 'text-purple-500',
    configurable: true,
  },
  DATE_TIME: {
    type: 'DATE_TIME',
    name: 'Date & time',
    icon: <Clock className="h-4 w-4" />,
    description: 'Date with time',
    category: 'basic',
    color: 'text-purple-500',
    configurable: true,
  },
  DURATION: {
    type: 'DURATION',
    name: 'Duration',
    icon: <Clock className="h-4 w-4" />,
    description: 'Time duration (e.g., 2:30)',
    category: 'basic',
    color: 'text-purple-500',
    configurable: true,
  },
  SINGLE_SELECT: {
    type: 'SINGLE_SELECT',
    name: 'Single select',
    icon: <Tag className="h-4 w-4" />,
    description: 'Select one option from a list',
    category: 'basic',
    color: 'text-yellow-500',
    configurable: true,
  },
  MULTI_SELECT: {
    type: 'MULTI_SELECT',
    name: 'Multiple select',
    icon: <Tag className="h-4 w-4" />,
    description: 'Select multiple options from a list',
    category: 'basic',
    color: 'text-yellow-500',
    configurable: true,
  },
  SINGLE_USER: {
    type: 'SINGLE_USER',
    name: 'User',
    icon: <User className="h-4 w-4" />,
    description: 'Select a single user',
    category: 'basic',
    color: 'text-blue-500',
    configurable: true,
  },
  MULTI_USER: {
    type: 'MULTI_USER',
    name: 'Multiple users',
    icon: <User className="h-4 w-4" />,
    description: 'Select multiple users',
    category: 'basic',
    color: 'text-blue-500',
    configurable: true,
  },
  CHECKBOX: {
    type: 'CHECKBOX',
    name: 'Checkbox',
    icon: <Check className="h-4 w-4" />,
    description: 'True or false value',
    category: 'basic',
    color: 'text-green-500',
    configurable: false,
  },
  RATING: {
    type: 'RATING',
    name: 'Rating',
    icon: <Star className="h-4 w-4" />,
    description: 'Star rating (1-5)',
    category: 'basic',
    color: 'text-yellow-500',
    configurable: true,
  },
  URL: {
    type: 'URL',
    name: 'URL',
    icon: <Link2 className="h-4 w-4" />,
    description: 'Web link',
    category: 'basic',
    color: 'text-blue-500',
    configurable: true,
  },
  EMAIL: {
    type: 'EMAIL',
    name: 'Email',
    icon: <Mail className="h-4 w-4" />,
    description: 'Email address',
    category: 'basic',
    color: 'text-blue-500',
    configurable: true,
  },
  PHONE: {
    type: 'PHONE',
    name: 'Phone',
    icon: <Phone className="h-4 w-4" />,
    description: 'Phone number',
    category: 'basic',
    color: 'text-blue-500',
    configurable: true,
  },
  ATTACHMENT: {
    type: 'ATTACHMENT',
    name: 'Attachment',
    icon: <Paperclip className="h-4 w-4" />,
    description: 'File attachments',
    category: 'advanced',
    color: 'text-gray-500',
    configurable: true,
  },
  LOCATION: {
    type: 'LOCATION',
    name: 'Location',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Geographic location',
    category: 'advanced',
    color: 'text-red-500',
    configurable: true,
    isNew: true,
  },
  FORMULA: {
    type: 'FORMULA',
    name: 'Formula',
    icon: <Calculator className="h-4 w-4" />,
    description: 'Computed value based on other fields',
    category: 'computed',
    color: 'text-indigo-500',
    configurable: true,
    isPremium: true,
  },
  ROLLUP: {
    type: 'ROLLUP',
    name: 'Rollup',
    icon: <BarChart className="h-4 w-4" />,
    description: 'Summarize linked records',
    category: 'computed',
    color: 'text-indigo-500',
    configurable: true,
    isPremium: true,
  },
  LOOKUP: {
    type: 'LOOKUP',
    name: 'Lookup',
    icon: <Link2 className="h-4 w-4" />,
    description: 'Look up values from linked records',
    category: 'computed',
    color: 'text-indigo-500',
    configurable: true,
    isPremium: true,
  },
  BUTTON: {
    type: 'BUTTON',
    name: 'Button',
    icon: <Code className="h-4 w-4" />,
    description: 'Trigger actions or automations',
    category: 'advanced',
    color: 'text-pink-500',
    configurable: true,
    isNew: true,
  },
  BARCODE: {
    type: 'BARCODE',
    name: 'Barcode',
    icon: <Hash className="h-4 w-4" />,
    description: 'Scan or enter barcodes',
    category: 'advanced',
    color: 'text-gray-500',
    configurable: true,
  },
  COLLABORATOR: {
    type: 'COLLABORATOR',
    name: 'Collaborator',
    icon: <User className="h-4 w-4" />,
    description: 'Team member from workspace',
    category: 'advanced',
    color: 'text-blue-500',
    configurable: true,
  },
  LAST_MODIFIED_TIME: {
    type: 'LAST_MODIFIED_TIME',
    name: 'Last modified time',
    icon: <Clock className="h-4 w-4" />,
    description: 'Time of last modification',
    category: 'system',
    color: 'text-gray-400',
    configurable: false,
  },
  LAST_MODIFIED_BY: {
    type: 'LAST_MODIFIED_BY',
    name: 'Last modified by',
    icon: <User className="h-4 w-4" />,
    description: 'User who last modified',
    category: 'system',
    color: 'text-gray-400',
    configurable: false,
  },
  CREATED_TIME: {
    type: 'CREATED_TIME',
    name: 'Created time',
    icon: <Clock className="h-4 w-4" />,
    description: 'Time of creation',
    category: 'system',
    color: 'text-gray-400',
    configurable: false,
  },
  CREATED_BY: {
    type: 'CREATED_BY',
    name: 'Created by',
    icon: <User className="h-4 w-4" />,
    description: 'User who created',
    category: 'system',
    color: 'text-gray-400',
    configurable: false,
  },
  AUTO_NUMBER: {
    type: 'AUTO_NUMBER',
    name: 'Auto number',
    icon: <Hash className="h-4 w-4" />,
    description: 'Automatically incrementing number',
    category: 'system',
    color: 'text-gray-400',
    configurable: true,
  },
};

export function getFieldIcon(type: FieldType, className?: string) {
  const field = FIELD_DEFINITIONS[type];
  if (!field) return null;
  
  return React.cloneElement(field.icon as React.ReactElement, {
    className: cn((field.icon as React.ReactElement).props.className, className),
  });
}

export function getFieldColor(type: FieldType) {
  return FIELD_DEFINITIONS[type]?.color || 'text-gray-500';
}

export function getFieldsByCategory(category: FieldDefinition['category']) {
  return Object.values(FIELD_DEFINITIONS).filter(f => f.category === category);
}