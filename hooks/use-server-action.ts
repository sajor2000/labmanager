'use client';

import { useState, useTransition } from 'react';
import { showToast } from '@/components/ui/toast';

type ActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

interface UseServerActionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useServerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResponse<TOutput>>,
  options?: UseServerActionOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | null>(null);
  const [isPending, startTransition] = useTransition();

  const execute = async (input: TInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await action(input);
      
      if (result.success) {
        setData(result.data);
        
        if (options?.successMessage) {
          showToast({
            type: 'success',
            title: 'Success',
            message: options.successMessage,
          });
        }
        
        options?.onSuccess?.(result.data);
        return result.data;
      } else {
        setError(result.error);
        
        showToast({
          type: 'error',
          title: 'Error',
          message: options?.errorMessage || result.error,
        });
        
        options?.onError?.(result.error);
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      
      showToast({
        type: 'error',
        title: 'Error',
        message: options?.errorMessage || errorMessage,
      });
      
      options?.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const executeWithTransition = (input: TInput) => {
    startTransition(async () => {
      await execute(input);
    });
  };

  return {
    execute,
    executeWithTransition,
    isLoading: isLoading || isPending,
    error,
    data,
  };
}