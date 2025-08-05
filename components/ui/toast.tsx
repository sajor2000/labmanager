"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
};

export function ToastComponent({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const Icon = icons[type];
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);
  
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all",
        colors[type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast Container
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Make addToast available globally
  useEffect(() => {
    (window as any).showToast = addToast;
  }, []);
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

// Helper function to show toasts
export const showToast = (toast: Omit<Toast, "id">) => {
  if (typeof window !== "undefined" && (window as any).showToast) {
    (window as any).showToast(toast);
  }
};