'use client';
import { useState, useEffect, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

type ToastOptions = Omit<Toast, 'id'>;

// Global state management outside of React
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let currentToasts: Toast[] = [];

function notifyListeners() {
  for (const listener of toastListeners) {
    listener([...currentToasts]);
  }
}

function addToast(options: ToastOptions) {
  const id = Math.random().toString(36).slice(2, 9);
  const newToast: Toast = { id, ...options };

  // Cap at 3 toasts — drop the oldest if needed
  currentToasts = [...currentToasts.slice(-2), newToast];
  notifyListeners();

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);

  return id;
}

function removeToast(id: string) {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function toast(options: ToastOptions) {
  return addToast(options);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(currentToasts);

  useEffect(() => {
    toastListeners.push(setToasts);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return { toasts, dismiss };
}
