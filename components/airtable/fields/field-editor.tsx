'use client';

import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Check, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { FieldType } from './field-types';

interface FieldEditorProps {
  type: FieldType;
  value: any;
  options?: any;
  onSave: (value: any) => void;
  onCancel: () => void;
  className?: string;
  autoFocus?: boolean;
}

export function FieldEditor({
  type,
  value: initialValue,
  options = {},
  onSave,
  onCancel,
  className,
  autoFocus = true,
}: FieldEditorProps) {
  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) {
      if (inputRef.current) inputRef.current.focus();
      if (textareaRef.current) textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSave = () => {
    onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  switch (type) {
    case 'TEXT':
    case 'URL':
    case 'EMAIL':
    case 'PHONE':
    case 'BARCODE':
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Input
            ref={inputRef}
            type={type === 'EMAIL' ? 'email' : type === 'URL' ? 'url' : 'text'}
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            placeholder={`Enter ${type.toLowerCase()}...`}
          />
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'LONG_TEXT':
      return (
        <div className={cn("space-y-2", className)}>
          <Textarea
            ref={textareaRef}
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel();
            }}
            className="min-h-[100px]"
            placeholder="Enter text..."
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      );

    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENT':
      return (
        <div className={cn("flex items-center gap-2", className)}>
          {type === 'CURRENCY' && (
            <span className="text-sm text-gray-500">
              {options.currency || '$'}
            </span>
          )}
          <Input
            ref={inputRef}
            type="number"
            value={value || ''}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            onKeyDown={handleKeyDown}
            className="flex-1"
            step={type === 'PERCENT' ? '1' : '0.01'}
            min={type === 'PERCENT' ? '0' : undefined}
            max={type === 'PERCENT' ? '100' : undefined}
          />
          {type === 'PERCENT' && (
            <span className="text-sm text-gray-500">%</span>
          )}
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'DATE':
    case 'DATE_TIME':
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(value, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(date) => {
                  setValue(date);
                  setIsOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'SINGLE_SELECT':
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Select
            value={value}
            onValueChange={(v) => {
              setValue(v);
              onSave(v);
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.choices?.map((choice: any) => (
                <SelectItem key={choice.id} value={choice.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: choice.color }}
                    />
                    {choice.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'MULTI_SELECT':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className={cn("space-y-2", className)}>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
              >
                {selectedValues.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedValues.map((v) => {
                      const choice = options.choices?.find((c: any) => c.id === v);
                      if (!choice) return null;
                      return (
                        <Badge
                          key={v}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: choice.color + '20',
                            color: choice.color,
                          }}
                        >
                          {choice.name}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select options...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search options..." />
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandGroup>
                  {options.choices?.map((choice: any) => (
                    <CommandItem
                      key={choice.id}
                      onSelect={() => {
                        const newValue = selectedValues.includes(choice.id)
                          ? selectedValues.filter((v) => v !== choice.id)
                          : [...selectedValues, choice.id];
                        setValue(newValue);
                      }}
                    >
                      <Checkbox
                        checked={selectedValues.includes(choice.id)}
                        className="mr-2"
                      />
                      <div
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: choice.color }}
                      />
                      {choice.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      );

    case 'SINGLE_USER':
    case 'COLLABORATOR':
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start"
              >
                {value ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={value.avatar} />
                      <AvatarFallback className="text-xs">
                        {value.initials || value.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{value.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select user...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  {options.users?.map((user: any) => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => {
                        setValue(user);
                        setIsOpen(false);
                        onSave(user);
                      }}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.initials || user.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {user.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );

    case 'CHECKBOX':
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => {
              setValue(checked);
              onSave(checked);
            }}
          />
          <span className="text-sm">
            {value ? 'Checked' : 'Unchecked'}
          </span>
        </div>
      );

    case 'RATING':
      const maxRating = options.max || 5;
      return (
        <div className={cn("flex items-center gap-2", className)}>
          {Array.from({ length: maxRating }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setValue(i + 1);
                onSave(i + 1);
              }}
              className="hover:scale-110 transition-transform"
            >
              <svg
                className={cn(
                  "h-6 w-6",
                  i < (value || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );

    default:
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <Input
            ref={inputRef}
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
  }
}