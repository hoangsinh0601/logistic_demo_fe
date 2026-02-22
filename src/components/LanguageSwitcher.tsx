import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const currentLanguage = i18n.language || window.localStorage.i18nextLng || 'en';

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe className="h-4 w-4" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => changeLanguage('en')}
                    className={currentLanguage.startsWith('en') ? 'bg-secondary font-medium' : ''}
                >
                    English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => changeLanguage('vi')}
                    className={currentLanguage.startsWith('vi') ? 'bg-secondary font-medium' : ''}
                >
                    Tiếng Việt (VI)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
