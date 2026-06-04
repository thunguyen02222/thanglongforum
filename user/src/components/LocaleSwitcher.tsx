import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@components/ui';

const LOCALES: { code: string; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' }
];

export function LocaleSwitcher() {
  const router = useRouter();
  const { i18n } = useTranslation();
  const currentLocale = router.locale ?? i18n.language ?? 'vi';
  const [open, setOpen] = useState(false);

  const currentLocaleData = LOCALES.find((l) => l.code === currentLocale);
  const currentLabel = currentLocaleData?.label ?? currentLocale;
  const currentFlag = currentLocaleData?.flag ?? '🌐';

  const handleChange = (locale: string) => {
    if (locale === currentLocale) return;
    setOpen(false);
    router.push(router.asPath, router.asPath, { locale, scroll: false });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          aria-label="Chọn ngôn ngữ"
        >
          <span className="text-lg leading-none" aria-hidden>{currentFlag}</span>
          <span className="max-w-[7rem] truncate">{currentLabel}</span>
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[min(70vh,20rem)] overflow-y-auto">
        {LOCALES.map(({ code, label, flag }) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => handleChange(code)}
            className={`flex items-center gap-2 ${currentLocale === code ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
          >
            <span className="text-lg leading-none" aria-hidden>{flag}</span>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
