import React, { useEffect } from 'react';
import getConfig from 'next/config';
import { usePublicSiteSettingsStore } from 'src/stores';

const { publicRuntimeConfig } = getConfig() || {};
const BASE_URL = publicRuntimeConfig?.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export default function SiteSettingsHead() {
  const {
    site_name, site_logo, site_favicon, loaded, fetchSiteSettings
  } = usePublicSiteSettingsStore();

  useEffect(() => {
    fetchSiteSettings();
  }, [fetchSiteSettings]);

  useEffect(() => {
    if (!loaded) return;
    document.title = site_name ? `${site_name} Admin` : ' Admin';
    const linkIcon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const linkApple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    const faviconHref = site_favicon
      ? site_favicon.startsWith('http')
        ? site_favicon
        : `${BASE_URL}${site_favicon.startsWith('/') ? '' : '/'}${site_favicon}`
      : '/logo.ico';
    if (linkIcon) linkIcon.href = faviconHref;
    if (linkApple) {
      linkApple.href = (site_logo
          && (site_logo.startsWith('http')
            ? site_logo
            : `${BASE_URL}${site_logo.startsWith('/') ? '' : '/'}${site_logo}`))
        || '/logo.png';
    }
  }, [loaded, site_name, site_favicon, site_logo]);

  return null;
}
