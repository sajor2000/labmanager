"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  onAsyncClick?: () => Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  confirmMessage?: string;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    loading: externalLoading,
    loadingText,
    onAsyncClick,
    successMessage,
    errorMessage,
    confirmMessage,
    onClick,
    disabled,
    ...props
  }, ref) => {
    const [internalLoading, setInternalLoading] = React.useState(false);
    
    const isLoading = externalLoading || internalLoading;
    const isDisabled = disabled || isLoading;

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      // If there's a confirmation message, show confirmation dialog
      if (confirmMessage && !window.confirm(confirmMessage)) {
        return;
      }

      if (onAsyncClick) {
        setInternalLoading(true);
        try {
          await onAsyncClick();
          if (successMessage) {
            showToast({
              type: "success",
              title: "Success",
              message: successMessage,
            });
          }
        } catch (error) {
          console.error("LoadingButton async operation failed:", error);
          showToast({
            type: "error",
            title: "Error",
            message: errorMessage || "Operation failed. Please try again.",
          });
        } finally {
          setInternalLoading(false);
        }
      } else if (onClick) {
        onClick(e);
      }
    };

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };