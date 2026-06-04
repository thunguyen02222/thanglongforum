import '../style/globals.css';

import React, { useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { SWRConfig } from 'swr';
import { useCurrentUserStore } from 'src/stores';
import dynamic from 'next/dynamic';
import DefaultLayout from '@layouts/DefaultLayout';
import SiteSettingsHead from '@components/SiteSettingsHead';
import { authService } from '@services/auth.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextI18NextConfig = require('../next-i18next.config.js');

const Toasty = dynamic(() => import('src/components/common/toasty'), {
  ssr: false,
  loading: () => null
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setCurrentUser, clearCurrentUser, setLoading } = useCurrentUserStore();

  const checkAuth = useCallback(async () => {
    const isAuthPage = router.pathname.startsWith('/auth');
    // Vô hiệu hoá redirect để test giao diện tĩnh mọi trang
    const isPublicPage = true; 
    const token = authService.getToken();

    if (!token) {
      clearCurrentUser();
      if (!isPublicPage) {
        router.push('/auth/login');
      }
      return;
    }

    try {
      const response = await authService.me();
      if (response?.data) {
        setCurrentUser(response.data);
      } else {
        clearCurrentUser();
        if (!isPublicPage) {
          router.push('/auth/login');
        }
      }
    } catch {
      clearCurrentUser();
      if (!isPublicPage) {
        router.push('/auth/login');
      }
    }
  }, [setCurrentUser, clearCurrentUser, router]);

  useEffect(() => {
    setLoading(true);
    checkAuth();
  }, [checkAuth, setLoading]);

  return <>{children}</>;
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAuthPage = router.pathname.startsWith('/auth');

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: true
      }}
    >
      <AuthProvider>
        <SiteSettingsHead />
        <Toasty />
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          }
        >
          {isAuthPage ? (
            <Component {...pageProps} />
          ) : (
            <DefaultLayout>
              <Component {...pageProps} />
            </DefaultLayout>
          )}
        </Suspense>
      </AuthProvider>
    </SWRConfig>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
