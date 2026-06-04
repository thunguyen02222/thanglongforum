import '../style/globals.css';

import React, { useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { SWRConfig } from 'swr';
import { useCurrentUserStore } from 'src/stores';
import dynamic from 'next/dynamic';
import AdminLayout from '@layouts/AdminLayout';
import { ToastProvider, SuspenseFallback } from '@components/ui';
import SiteSettingsHead from '@components/SiteSettingsHead';
import { authService } from '@services/auth.service';

const nextI18NextConfig = require('../next-i18next.config.js');

const Toasty = dynamic(() => import('src/components/common/toasty'), {
  ssr: false,
  loading: () => null
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setCurrentUser } = useCurrentUserStore();

  useEffect(() => {
    // Mock admin user cho mục đích test UI giao diện
    setCurrentUser({
      _id: 'mock-admin',
      name: 'Admin',
      role: 'admin',
      email: 'admin@thanglong.edu.vn',
      avatarUrl: '',
      createdAt: '',
      updatedAt: '',
      status: 'active'
    } as any);
  }, [setCurrentUser]);

  return <>{children}</>;
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoginPage = router.pathname === '/auth/login';

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: true
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <SiteSettingsHead />
          <Toasty />
          <Suspense fallback={<SuspenseFallback variant="page" />}>
            {isLoginPage ? (
              <Component {...pageProps} />
            ) : (
              <AdminLayout>
                <Component {...pageProps} />
              </AdminLayout>
            )}
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </SWRConfig>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
