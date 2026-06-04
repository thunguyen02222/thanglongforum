import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetStaticProps } from 'next';
import { Settings, Mail, LogIn } from 'lucide-react';
import EmailSettingsTab from './components/EmailSettingsTab';
import GeneralSettingsTab from './components/GeneralSettingsTab';
import AuthSettingsTab from './components/AuthSettingsTab';

type TabId = 'general' | 'email' | 'auth';

const TAB_KEYS: { id: TabId; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'general', labelKey: 'settings.tabGeneral', icon: <Settings className="w-4 h-4" /> },
  { id: 'email', labelKey: 'settings.tabEmail', icon: <Mail className="w-4 h-4" /> },
  { id: 'auth', labelKey: 'settings.tabAuth', icon: <LogIn className="w-4 h-4" /> }
];

const TAB_IDS: TabId[] = ['general', 'email', 'auth'];

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'vi', ['common']))
  }
});

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const TABS = useMemo(
    () => TAB_KEYS.map((tab) => ({ ...tab, label: t(tab.labelKey) })),
    [t]
  );
  const tabFromQuery = typeof router.query.tab === 'string' && TAB_IDS.includes(router.query.tab as TabId)
    ? (router.query.tab as TabId)
    : null;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromQuery ?? 'general');

  useEffect(() => {
    if (tabFromQuery) setActiveTab(tabFromQuery);
  }, [tabFromQuery]);

  const setActiveTabAndQuery = (tab: TabId) => {
    setActiveTab(tab);
    router.replace({ pathname: '/settings', query: tab === 'general' ? {} : { tab } }, undefined, {
      shallow: true
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'email':
        return <EmailSettingsTab />;
      case 'auth':
        return <AuthSettingsTab />;
      case 'general':
      default:
        return <GeneralSettingsTab />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabAndQuery(tab.id)}
              className={`
                flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">{renderTabContent()}</div>
    </div>
  );
}
