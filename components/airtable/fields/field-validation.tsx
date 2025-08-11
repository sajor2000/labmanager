'use client';

import { z } from 'zod';
import type { FieldType } from './field-types';

export interface ValidationRule {
  type: string;
  value?: any;
  message?: string;
}

export interface FieldValidationConfig {
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customRules?: ValidationRule[];
}

export function createFieldValidator(
  type: FieldType,
  config: FieldValidationConfig = {}
): z.ZodSchema<any> {
  let schema: z.ZodSchema<any>;

  switch (type) {
    case 'TEXT':
      schema = z.string();
      if (config.minLength) schema = (schema as z.ZodString).min(config.minLength, config.customRules?.[0]?.message);
      if (config.maxLength) schema = (schema as z.ZodString).max(config.maxLength, config.customRules?.[1]?.message);
      if (config.pattern) schema = (schema as z.ZodString).regex(new RegExp(config.pattern), config.customRules?.[2]?.message);
      break;

    case 'LONG_TEXT':
      schema = z.string();
      if (config.minLength) schema = (schema as z.ZodString).min(config.minLength);
      if (config.maxLength) schema = (schema as z.ZodString).max(config.maxLength);
      break;

    case 'NUMBER':
      schema = z.number();
      if (config.min !== undefined) schema = (schema as z.ZodNumber).min(config.min);
      if (config.max !== undefined) schema = (schema as z.ZodNumber).max(config.max);
      break;

    case 'CURRENCY':
      schema = z.number().positive();
      if (config.min !== undefined) schema = (schema as z.ZodNumber).min(config.min);
      if (config.max !== undefined) schema = (schema as z.ZodNumber).max(config.max);
      break;

    case 'PERCENT':
      schema = z.number().min(0).max(100);
      break;

    case 'DATE':
      schema = z.date().or(z.string().transform(s => new Date(s)));
      break;

    case 'DATE_TIME':
      schema = z.date().or(z.string().transform(s => new Date(s)));
      break;

    case 'DURATION':
      schema = z.number().min(0);
      break;

    case 'SINGLE_SELECT':
      schema = z.string();
      break;

    case 'MULTI_SELECT':
      schema = z.array(z.string());
      if (config.min) schema = (schema as z.ZodArray<any>).min(config.min);
      if (config.max) schema = (schema as z.ZodArray<any>).max(config.max);
      break;

    case 'SINGLE_USER':
    case 'COLLABORATOR':
      schema = z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional(),
        initials: z.string().optional(),
      });
      break;

    case 'MULTI_USER':
      schema = z.array(z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional(),
        initials: z.string().optional(),
      }));
      if (config.min) schema = (schema as z.ZodArray<any>).min(config.min);
      if (config.max) schema = (schema as z.ZodArray<any>).max(config.max);
      break;

    case 'CHECKBOX':
      schema = z.boolean();
      break;

    case 'RATING':
      schema = z.number().int().min(1).max(config.max || 5);
      break;

    case 'URL':
      schema = z.string().url('Please enter a valid URL');
      break;

    case 'EMAIL':
      schema = z.string().email('Please enter a valid email address');
      break;

    case 'PHONE':
      schema = z.string().regex(
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Please enter a valid phone number'
      );
      break;

    case 'ATTACHMENT':
      schema = z.array(z.object({
        id: z.string(),
        filename: z.string(),
        size: z.number(),
        url: z.string(),
        mimeType: z.string(),
      }));
      break;

    case 'LOCATION':
      schema = z.object({
        address: z.string(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      });
      break;

    case 'FORMULA':
    case 'ROLLUP':
    case 'LOOKUP':
      schema = z.any(); // Computed fields, validation depends on formula
      break;

    case 'BUTTON':
      schema = z.boolean().optional();
      break;

    case 'BARCODE':
      schema = z.string();
      if (config.pattern) schema = (schema as z.ZodString).regex(new RegExp(config.pattern));
      break;

    case 'AUTO_NUMBER':
      schema = z.number().int().positive();
      break;

    case 'CREATED_TIME':
    case 'LAST_MODIFIED_TIME':
      schema = z.date();
      break;

    case 'CREATED_BY':
    case 'LAST_MODIFIED_BY':
      schema = z.object({
        id: z.string(),
        name: z.string(),
      });
      break;

    default:
      schema = z.any();
  }

  // Apply required/optional
  if (!config.required) {
    schema = schema.optional().nullable();
  }

  return schema;
}

export function validateField(
  type: FieldType,
  value: any,
  config: FieldValidationConfig = {}
): { success: boolean; error?: string } {
  try {
    const validator = createFieldValidator(type, config);
    validator.parse(value);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || 'Validation failed' 
      };
    }
    return { 
      success: false, 
      error: 'Unknown validation error' 
    };
  }
}

export function getValidationRules(type: FieldType): ValidationRule[] {
  switch (type) {
    case 'TEXT':
    case 'LONG_TEXT':
      return [
        { type: 'required', message: 'This field is required' },
        { type: 'minLength', message: 'Minimum length not met' },
        { type: 'maxLength', message: 'Maximum length exceeded' },
        { type: 'pattern', message: 'Invalid format' },
      ];

    case 'NUMBER':
    case 'CURRENCY':
      return [
        { type: 'required', message: 'This field is required' },
        { type: 'min', message: 'Value is too small' },
        { type: 'max', message: 'Value is too large' },
        { type: 'integer', message: 'Must be a whole number' },
      ];

    case 'DATE':
    case 'DATE_TIME':
      return [
        { type: 'required', message: 'This field is required' },
        { type: 'minDate', message: 'Date is too early' },
        { type: 'maxDate', message: 'Date is too late' },
        { type: 'weekday', message: 'Must be a weekday' },
      ];

    case 'SINGLE_SELECT':
      return [
        { type: 'required', message: 'Please select an option' },
        { type: 'allowedValues', message: 'Invalid selection' },
      ];

    case 'MULTI_SELECT':
      return [
        { type: 'required', message: 'Please select at least one option' },
        { type: 'minItems', message: 'Select more items' },
        { type: 'maxItems', message: 'Too many items selected' },
      ];

    case 'EMAIL':
      return [
        { type: 'required', message: 'This field is required' },
        { type: 'validEmail', message: 'Invalid email format' },
        { type: 'domain', message: 'Invalid email domain' },
      ];

    case 'URL':
      return [
        { type: 'required', message: 'This field is required' },
        { type: 'validUrl', message: 'Invalid URL format' },
        { type: 'protocol', message: 'URL must start with http:// or https://' },
      ];

    case 'PHONE':
      return [
        { type: 'required', message: 'This field is required' },
        { type: 'validPhone', message: 'Invalid phone number' },
        { type: 'country', message: 'Invalid country code' },
      ];

    default:
      return [
        { type: 'required', message: 'This field is required' },
      ];
  }
}

export class FieldValidationBuilder {
  private rules: ValidationRule[] = [];
  private config: FieldValidationConfig = {};

  required(message?: string): this {
    this.config.required = true;
    if (message) {
      this.rules.push({ type: 'required', message });
    }
    return this;
  }

  unique(message?: string): this {
    this.config.unique = true;
    if (message) {
      this.rules.push({ type: 'unique', message });
    }
    return this;
  }

  min(value: number, message?: string): this {
    this.config.min = value;
    if (message) {
      this.rules.push({ type: 'min', value, message });
    }
    return this;
  }

  max(value: number, message?: string): this {
    this.config.max = value;
    if (message) {
      this.rules.push({ type: 'max', value, message });
    }
    return this;
  }

  minLength(value: number, message?: string): this {
    this.config.minLength = value;
    if (message) {
      this.rules.push({ type: 'minLength', value, message });
    }
    return this;
  }

  maxLength(value: number, message?: string): this {
    this.config.maxLength = value;
    if (message) {
      this.rules.push({ type: 'maxLength', value, message });
    }
    return this;
  }

  pattern(pattern: string, message?: string): this {
    this.config.pattern = pattern;
    if (message) {
      this.rules.push({ type: 'pattern', value: pattern, message });
    }
    return this;
  }

  custom(rule: ValidationRule): this {
    this.rules.push(rule);
    if (!this.config.customRules) {
      this.config.customRules = [];
    }
    this.config.customRules.push(rule);
    return this;
  }

  build(): FieldValidationConfig {
    return {
      ...this.config,
      customRules: this.rules,
    };
  }
}

// Helper function to create validation config
export function createValidationConfig(): FieldValidationBuilder {
  return new FieldValidationBuilder();
}