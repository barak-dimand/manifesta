import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border-border bg-cream text-forest',
        destructive: 'border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// Toast Provider wrapper — simply renders children
const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
ToastProvider.displayName = 'ToastProvider';

// Viewport where toasts are rendered
const ToastViewport = React.forwardRef<HTMLOListElement, React.HTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]',
        className,
      )}
      {...props}
    />
  ),
);
ToastViewport.displayName = 'ToastViewport';

// Root toast element
export interface ToastProps
  extends React.HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof toastVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <li ref={ref} className={cn(toastVariants({ variant }), className)} {...props}>
        {children}
      </li>
    );
  },
);
Toast.displayName = 'Toast';

// Action button inside a toast
const ToastAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors',
        'border-sage/30 hover:border-sage hover:bg-sage-light',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        'group-[.destructive]:border-destructive/30 group-[.destructive]:hover:border-destructive group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground',
        className,
      )}
      {...props}
    />
  ),
);
ToastAction.displayName = 'ToastAction';

// Close button
const ToastClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'absolute right-2 top-2 rounded-md p-1 text-forest/50 opacity-0 transition-opacity',
        'hover:text-forest focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring',
        'group-hover:opacity-100',
        'group-[.destructive]:text-red-100 group-[.destructive]:hover:text-white',
        className,
      )}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  ),
);
ToastClose.displayName = 'ToastClose';

// Title
const ToastTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm font-semibold leading-none', className)} {...props} />
  ),
);
ToastTitle.displayName = 'ToastTitle';

// Description
const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = 'ToastDescription';

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
};
