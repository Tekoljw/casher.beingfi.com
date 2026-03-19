import { useLanguage } from "@/hooks/use-language";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher() {
  // 添加错误处理以防useLanguage在LanguageProvider外部被调用
  let language = 'zh';
  let setLanguage = (lang: any) => console.log('Language change not available');
  let translations: Record<string, Record<string, string>> = {};
  
  try {
    const langContext = useLanguage();
    language = langContext.language;
    setLanguage = langContext.setLanguage;
    translations = langContext.translations || {};
  } catch (e) {
    console.log('LanguageProvider not available, using fallback mode');
  }

  // 语言代码到名称的映射
  const languageCodeToName: Record<string, string> = {
    'zh': '中文',
    'en': 'English',
    'mm': 'မြန်မာ',
    'fr': 'Français',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'id': 'Bahasa Indonesia',
    'CN': '中文',
    'EN': 'English',
    'MM': 'မြန်မာ',
  };

  // 获取当前语言的显示名称
  const getLanguageName = (langCode: string): string => {
    return languageCodeToName[langCode] || langCode.toUpperCase();
  };

  // 直接从 translations 对象获取所有语言代码
  const translationKeys = translations ? Object.keys(translations) : [];
  
  // 获取所有可用的语言列表（直接从 translations 获取，不进行任何过滤）
  const availableLanguages = translationKeys
    .map(langCode => {
      // 确保语言代码存在且是字符串
      if (!langCode || typeof langCode !== 'string') return null;
      return {
        code: langCode,
        name: languageCodeToName[langCode] || languageCodeToName[langCode.toLowerCase()] || langCode.toUpperCase()
      };
    })
    .filter((lang): lang is { code: string; name: string } => lang !== null) // 过滤掉 null
    .sort((a, b) => {
      // 排序：中文优先，然后是英文，其他按字母顺序
      const order: Record<string, number> = { 'zh': 1, 'en': 2, 'mm': 3 };
      const orderA = order[a.code.toLowerCase()] || 999;
      const orderB = order[b.code.toLowerCase()] || 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.code.localeCompare(b.code);
    });

  // 调试：打印可用语言（仅在开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('LanguageSwitcher - Translations object keys:', translationKeys);
    console.log('LanguageSwitcher - Available languages count:', availableLanguages.length);
    console.log('LanguageSwitcher - Available languages:', availableLanguages.map(l => `${l.code}: ${l.name}`));
  }

  const currentLanguageName = getLanguageName(language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-white hover:bg-gray-800 flex items-center gap-1.5 sm:gap-2">
          <Globe className="h-[1.2rem] w-[1.2rem] flex-shrink-0" />
          <span className="text-sm sm:text-base">{currentLanguageName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.length > 0 ? (
          availableLanguages.map(lang => (
            <DropdownMenuItem 
              key={lang.code} 
              onClick={() => setLanguage(lang.code as any)} 
              className={language === lang.code ? "bg-accent/20" : ""}
            >
              {lang.name}
            </DropdownMenuItem>
          ))
        ) : (
          <>
            <DropdownMenuItem onClick={() => setLanguage('zh' as any)} className={language === 'zh' ? "bg-accent/20" : ""}>
              中文
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('en' as any)} className={language === 'en' ? "bg-accent/20" : ""}>
              English
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}