import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const getCurrentLanguage = () => {
    const current = i18n.language;
    if (current.startsWith('vi')) return 'VI';
    if (current.startsWith('en')) return 'EN';
    if (current.startsWith('zh')) return 'ZH';
    return 'VI';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('vi')}>
          <span className="mr-2">🇻🇳</span>
          Tiếng Việt
          {getCurrentLanguage() === 'VI' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          <span className="mr-2">🇬🇧</span>
          English
          {getCurrentLanguage() === 'EN' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('zh')}>
          <span className="mr-2">🇨🇳</span>
          中文
          {getCurrentLanguage() === 'ZH' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
