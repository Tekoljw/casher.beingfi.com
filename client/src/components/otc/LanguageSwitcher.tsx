import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { Globe } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// OTC系统专用语言切换器
export default function OtcLanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    setLanguage(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="w-9 h-9 rounded-full border-blue-500/30 bg-blue-500/10">
          <Globe className="h-4 w-4 text-blue-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white">
        <DropdownMenuItem 
          className={`${language === 'zh' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
          onClick={() => handleLanguageChange('zh')}
        >
          {t('bepay.language.chinese')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className={`${language === 'en' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
          onClick={() => handleLanguageChange('en')}
        >
          {t('bepay.language.english')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}