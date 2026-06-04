import React, { useEffect } from 'react';
import { initToaster } from '@lib/toast';

/**
 * Ensures toaster-ui is initialized on mount (client-side).
 * Renders nothing; toaster-ui manages its own container in document.body.
 */
export default function Toasty() {
  useEffect(() => {
    initToaster();
  }, []);
  return null;
}
