"use client";

import * as React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'info';
  loading?: boolean;
  showWarning?: boolean; // Show "cannot be undone" warning
}

const variantConfig = {
  destructive: {
    icon: Trash2,
    iconClass: "h-6 w-6 text-red-600",
    confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "h-6 w-6 text-yellow-600",
    confirmButtonClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
  },
  info: {
    icon: AlertTriangle,
    iconClass: "h-6 w-6 text-blue-600",
    confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'destructive',
  loading = false,
  showWarning = true, // Default to showing warning for destructive actions
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <Icon className={config.iconClass} />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="mt-3 text-left space-y-2">
            <span>{description}</span>
            {showWarning && variant === 'destructive' && (
              <span className="block font-semibold text-red-600 dark:text-red-400">
                ⚠️ This action cannot be undone.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <LoadingButton
            onAsyncClick={handleConfirm}
            loading={loading}
            loadingText="Processing..."
            className={config.confirmButtonClass}
          >
            {confirmText}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing confirmation dialogs
export function useConfirmationDialog() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    props: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>;
  }>({
    isOpen: false,
    props: {
      onConfirm: () => {},
      title: '',
      description: '',
    },
  });

  const confirm = React.useCallback((props: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        props: {
          ...props,
          onConfirm: async () => {
            await props.onConfirm();
            resolve(true);
          },
        },
      });
    });
  }, []);

  const close = React.useCallback(() => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const ConfirmationDialogComponent = React.useCallback(() => (
    <ConfirmationDialog
      isOpen={dialog.isOpen}
      onClose={close}
      {...dialog.props}
    />
  ), [dialog, close]);

  return {
    confirm,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}