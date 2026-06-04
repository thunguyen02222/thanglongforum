/**
 * Toast notifications via toaster-ui.
 * Use this module for toast across the user app.
 */

type ToasterUiInstance = {
  addToast: (
    content: string,
    type?: string,
    options?: { duration?: number; autoClose?: boolean; onClose?: () => void }
  ) => string | number;
  updateToast: (
    id: string | number,
    newContent?: string,
    newType?: string,
    newOptions?: Record<string, unknown>
  ) => void;
};

let toasterInstance: ToasterUiInstance | null = null;

function getToaster(): ToasterUiInstance | null {
  if (typeof window === 'undefined') return null;
  if (!toasterInstance) {
    const ToasterUiModule = require('toaster-ui');
    const ToasterUi = ToasterUiModule?.default ?? ToasterUiModule;
    if (typeof ToasterUi !== 'function') {
      throw new Error('toaster-ui: expected a constructor');
    }
    toasterInstance = new ToasterUi() as ToasterUiInstance;
  }
  return toasterInstance;
}

export function initToaster(): void {
  getToaster();
}

const DEFAULT_DURATION = 4000;

export const toast = {
  success: (message: string, options?: { duration?: number }) => {
    const t = getToaster();
    if (t) t.addToast(message, 'success', { duration: options?.duration ?? DEFAULT_DURATION });
  },
  error: (message: string, options?: { duration?: number }) => {
    const t = getToaster();
    if (t) t.addToast(message, 'error', { duration: options?.duration ?? DEFAULT_DURATION });
  },
  info: (message: string, options?: { duration?: number }) => {
    const t = getToaster();
    if (t) t.addToast(message, 'info', { duration: options?.duration ?? DEFAULT_DURATION });
  },
  warning: (message: string, options?: { duration?: number }) => {
    const t = getToaster();
    if (t) t.addToast(message, 'warning', { duration: options?.duration ?? DEFAULT_DURATION });
  },
  loading: (message: string): string | number | undefined => {
    const t = getToaster();
    return t ? t.addToast(message, 'loading', { autoClose: false }) : undefined;
  },
  update: (
    id: string | number,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' | 'default' = 'default',
    options?: { autoClose?: boolean; duration?: number }
  ) => {
    const t = getToaster();
    if (t) t.updateToast(id, message, type, options);
  },
  default: (message: string, options?: { duration?: number }) => {
    const t = getToaster();
    if (t) t.addToast(message, 'default', { duration: options?.duration ?? DEFAULT_DURATION });
  }
};
