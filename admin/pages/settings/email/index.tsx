import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EmailSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=email');
  }, [router]);

  return null;
}
