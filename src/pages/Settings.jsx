import React from 'react';
import { logout as firebaseLogout } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Moon, Sun, Languages, LogOut } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { useTheme } from '@/components/ThemeContext';

export default function Settings() {
  const navigate = useNavigate();
  const { t, language, changeLanguage, isRtl } = useLanguage();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleLogout = () => {
    firebaseLogout();
    navigate(createPageUrl('SignIn'));
  };

  return (
    <div className={`min-h-screen bg-[#F1F1F2] dark:bg-slate-900 py-8 px-6 ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(createPageUrl('Chat'))}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          {language === 'ar' ? 'العودة' : 'Back'}
        </button>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">{t('settings')}</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                {language === 'ar' ? 'المظهر' : 'Appearance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">{t('darkMode')}</Label>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                {t('language')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={language === 'en' ? 'default' : 'outline'}
                  onClick={() => changeLanguage('en')}
                  className={language === 'en' ? 'bg-[#1995AD] hover:bg-[#1995AD]/90' : ''}
                >
                  English
                </Button>
                <Button
                  variant={language === 'ar' ? 'default' : 'outline'}
                  onClick={() => changeLanguage('ar')}
                  className={language === 'ar' ? 'bg-[#1995AD] hover:bg-[#1995AD]/90' : ''}
                >
                  العربية
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                {t('logout')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout}>
                {t('logout')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}