import Swal from 'sweetalert2';

export type SwalIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

const defaultConfirmText = 'Xác nhận';
const defaultCancelText = 'Hủy';

/**
 * Replaces window.alert() with a SweetAlert2 modal.
 */
export async function alert(
  title: string,
  text?: string,
  icon: SwalIcon = 'info'
): Promise<void> {
  await Swal.fire({
    title,
    text,
    icon
  });
}

/**
 * Replaces window.confirm() with a SweetAlert2 modal.
 * Returns true if user clicks confirm, false if cancel or dismiss.
 */
export async function confirm(
  title: string,
  text?: string,
  options?: { confirmText?: string; cancelText?: string; icon?: SwalIcon }
): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: options?.icon ?? 'warning',
    showCancelButton: true,
    confirmButtonText: options?.confirmText ?? defaultConfirmText,
    cancelButtonText: options?.cancelText ?? defaultCancelText
  });
  return result.isConfirmed;
}

export { Swal };
