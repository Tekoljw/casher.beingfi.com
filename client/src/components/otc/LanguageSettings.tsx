import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Languages, Plus, Search, Pencil, Trash2, MoreVertical, Save } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AddLanguageDialog from "./AddLanguageDialog";
import EditLanguageDialog from "./EditLanguageDialog";
import DeleteLanguageDialog from "./DeleteLanguageDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 翻译项目的类型
interface TranslationItem {
  key: string;
  [langCode: string]: string | boolean; // 支持任意语言代码，如 chinese, english, mm 等
  enabled: boolean;
}

// 语言类型
interface Language {
  code: string;
  name: string;
}

// 语言代码到名称的映射（移到组件外部，避免初始化顺序问题）
const languageCodeToName: Record<string, string> = {
  'EN': '英语',
  'CN': '中文',
  'MM': '缅甸语',
  'FR': '法语',
  'ES': '西班牙语',
  'DE': '德语',
  'IT': '意大利语',
  'PT': '葡萄牙语',
  'RU': '俄语',
  'JA': '日语',
  'KO': '韩语',
  'AR': '阿拉伯语',
  'HI': '印地语',
  'TH': '泰语',
  'VI': '越南语',
  'ID': '印尼语',
};

export function LanguageSettings() {
  const { t, translations: contextTranslations, updateTranslations, language: appLanguage } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  // 使用当前应用语言作为默认选择
  const [currentLanguage, setCurrentLanguage] = useState<string>(appLanguage || "zh"); // 支持任意语言代码
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 从 contextTranslations 动态获取所有语言
  const [languages, setLanguages] = useState<Language[]>(() => {
    // 初始化时从 contextTranslations 获取所有语言
    const langCodes = Object.keys(contextTranslations || {});
    return langCodes.map(code => {
      const upperCode = code.toUpperCase();
      // 将语言代码转换为显示格式（zh -> CN, en -> EN, mm -> MM）
      const displayCode = code === 'zh' ? 'CN' : code === 'en' ? 'EN' : upperCode;
      return {
        code: displayCode,
        name: languageCodeToName[displayCode] || displayCode
      };
    });
  });
  
  // 从 context 中获取翻译数据并转换为编辑格式
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  
  // 同步 languages 列表：当 contextTranslations 变化时更新
  useEffect(() => {
    if (contextTranslations) {
      const langCodes = Object.keys(contextTranslations);
      const newLanguages = langCodes.map(code => {
        const upperCode = code.toUpperCase();
        const displayCode = code === 'zh' ? 'CN' : code === 'en' ? 'EN' : upperCode;
        return {
          code: displayCode,
          name: languageCodeToName[displayCode] || displayCode
        };
      });
      setLanguages(newLanguages);
    }
  }, [contextTranslations]);
  
  // 同步当前语言：当应用语言变化时，更新编辑语言选择
  useEffect(() => {
    if (appLanguage && contextTranslations && contextTranslations[appLanguage]) {
      // 如果应用语言在翻译字典中存在，则同步到编辑语言选择
      if (appLanguage !== currentLanguage) {
        setCurrentLanguage(appLanguage);
      }
    }
  }, [appLanguage, contextTranslations]);

  // 将 context 中的翻译数据转换为编辑格式
  useEffect(() => {
    if (contextTranslations) {
      const allKeys = new Set<string>();
      // 收集所有语言的所有翻译键
      Object.keys(contextTranslations).forEach(langCode => {
        Object.keys(contextTranslations[langCode] || {}).forEach(key => allKeys.add(key));
      });
      
      // 转换为 TranslationItem 格式，支持所有语言
      const translationItems: TranslationItem[] = Array.from(allKeys).map(key => {
        const item: TranslationItem = { key, enabled: true };
        // 为每个语言添加对应的值
        Object.keys(contextTranslations).forEach(langCode => {
          // 将语言代码转换为字段名（zh -> chinese, en -> english, mm -> mm）
          const fieldName = langCode === 'zh' ? 'chinese' : langCode === 'en' ? 'english' : langCode.toLowerCase();
          item[fieldName] = contextTranslations[langCode]?.[key] || '';
        });
        return item;
      });
      
      setTranslations(translationItems);
    }
  }, [contextTranslations]);
  
  // 处理添加新语言
  const handleAddLanguage = () => {
    setIsAddDialogOpen(true);
  };
  
  // 处理编辑语言
  const handleEditLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setIsEditDialogOpen(true);
  };
  
  // 处理删除语言
  const handleDeleteLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setIsDeleteDialogOpen(true);
  };

  // 处理添加新语言提交
  const handleAddLanguageSubmit = async (code: string) => {
    // 检查是否已存在
    if (languages.some(lang => lang.code === code)) {
      toast({
        title: t('language.error.exists', '语言已存在'),
        description: t('language.error.existsDescription', `语言代码 ${code} 已存在`),
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // 将显示代码转换为内部代码（CN -> zh, EN -> en, MM -> mm）
      const langCode = code === 'CN' ? 'zh' : code === 'EN' ? 'en' : code.toLowerCase();
      
      // 根据代码生成名称，如果映射中没有则使用代码本身
      const name = languageCodeToName[code] || code;
      
      // 1. 复制中文内容到新语言
      const updatedContextTranslations = { ...contextTranslations };
      if (updatedContextTranslations.zh) {
        // 复制中文的所有翻译到新语言
        updatedContextTranslations[langCode] = { ...updatedContextTranslations.zh };
      } else {
        // 如果没有中文，创建一个空的翻译字典
        updatedContextTranslations[langCode] = {};
      }
      
      // 2. 更新 context 中的翻译数据
      updateTranslations(updatedContextTranslations);
      
      // 3. 更新本地 translations 状态（添加新语言的字段）
      const updatedTranslations = translations.map(item => {
        const newItem = { ...item };
        // 为新语言添加字段（复制中文内容）
        const fieldName = langCode === 'zh' ? 'chinese' : langCode === 'en' ? 'english' : langCode.toLowerCase();
        newItem[fieldName] = item.chinese || ''; // 复制中文内容
        return newItem;
      });
      setTranslations(updatedTranslations);
      
      // 4. 添加新语言到 languages 列表
      setLanguages([...languages, { code, name }]);
      
      // 5. 切换到新语言的编辑页面
      setCurrentLanguage(langCode);
      
      // 6. 自动保存并上传到后端
      const configData: Record<string, Record<string, string>> = {};
      Object.keys(updatedContextTranslations).forEach(lang => {
        configData[lang] = {};
        updatedTranslations.forEach(item => {
          const fieldName = lang === 'zh' ? 'chinese' : lang === 'en' ? 'english' : lang.toLowerCase();
          const value = item[fieldName] as string;
          if (value) {
            configData[lang][item.key] = value;
          }
        });
      });
      
      const response = await apiRequest<{ code: number; msg: string }>('POST', '/Api/Index/saveLangConfig', {
        config: JSON.stringify(configData)
      });
      
      if (response.code === 0) {
        toast({
          title: t('language.success.added', '添加成功'),
          description: t('language.success.addedAndSaved', `语言 ${name} (${code}) 已成功添加并保存，已自动复制中文内容`)
            .replace(/{name}/g, name)
            .replace(/{code}/g, code),
        });
      } else {
        toast({
          title: t('language.success.added', '添加成功'),
          description: t('language.warning.saveFailed', `语言 ${name} (${code}) 已添加，但保存失败：${response.msg}`)
            .replace(/{name}/g, name)
            .replace(/{code}/g, code)
            .replace(/{msg}/g, response.msg || ''),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error adding language:', error);
      toast({
        title: t('language.error.addFailed', '添加失败'),
        description: error.message || t('language.error.addFailedDescription', '添加语言失败，请稍后重试'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 处理编辑语言提交
  const handleEditLanguageSubmit = (oldCode: string, newCode: string, newName: string) => {
    // 判断是否为基础语言（中文），不允许修改代码，只允许修改名称
    if (oldCode === "CN" && newCode !== "CN") {
      toast({
        title: t('language.error.baseLanguage', '无法修改'),
        description: t('language.error.baseLanguageCodeDescription', '基础语言代码不允许修改'),
        variant: "destructive"
      });
      return;
    }
    
    // 检查修改后的代码是否与其他语言冲突
    if (oldCode !== newCode && languages.some(lang => lang.code === newCode)) {
      toast({
        title: t('language.error.exists', '语言已存在'),
        description: t('language.error.existsDescription', `语言代码 ${newCode} 已存在`),
        variant: "destructive"
      });
      return;
    }
    
    // 更新语言
    setLanguages(languages.map(lang => 
      lang.code === oldCode ? { code: newCode, name: newName } : lang
    ));
    
    // 如果当前选中的语言被修改，需要更新当前选中的语言
    // 将语言代码转换为 currentLanguage 格式（CN -> zh, EN -> en）
    const oldLangCode = oldCode === 'CN' ? 'zh' : oldCode === 'EN' ? 'en' : oldCode.toLowerCase() as "zh" | "en";
    const newLangCode = newCode === 'CN' ? 'zh' : newCode === 'EN' ? 'en' : newCode.toLowerCase() as "zh" | "en";
    if (currentLanguage === oldLangCode) {
      setCurrentLanguage(newLangCode);
    }
    
    toast({
      title: t('language.success.updated', '更新成功'),
      description: t('language.success.languageUpdated', `语言 ${newName} (${newCode}) 已成功更新`),
    });
    
    // 关闭对话框
    setIsEditDialogOpen(false);
  };
  
  // 处理删除语言提交
  const handleDeleteLanguageSubmit = async () => {
    if (!selectedLanguage) return;
    
    // 判断是否为基础语言（中文），不允许删除
    if (selectedLanguage.code === "CN") {
      toast({
        title: t('language.error.baseLanguage', '无法删除'),
        description: t('language.error.baseLanguageDescription', '基础语言不允许删除'),
        variant: "destructive"
      });
      return;
    }
    
    // 判断是否为最后一个语言
    if (languages.length <= 2) { // 保留CN和至少一种其他语言
      toast({
        title: t('language.error.lastLanguage', '无法删除'),
        description: t('language.error.lastLanguageDescription', '必须保留至少一种额外语言'),
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // 将显示代码转换为内部代码（CN -> zh, EN -> en, MM -> mm）
      const selectedLangCode = selectedLanguage.code === 'CN' ? 'zh' : selectedLanguage.code === 'EN' ? 'en' : selectedLanguage.code.toLowerCase();
      
      // 1. 从 contextTranslations 中删除该语言
      const updatedContextTranslations = { ...contextTranslations };
      delete updatedContextTranslations[selectedLangCode];
      
      // 2. 更新 context 中的翻译数据
      updateTranslations(updatedContextTranslations);
      
      // 3. 从本地 translations 状态中删除该语言的字段
      const fieldName = selectedLangCode === 'zh' ? 'chinese' : selectedLangCode === 'en' ? 'english' : selectedLangCode.toLowerCase();
      const updatedTranslations = translations.map(item => {
        const newItem = { ...item };
        delete newItem[fieldName];
        return newItem;
      });
      setTranslations(updatedTranslations);
      
      // 4. 从 languages 列表中删除该语言
      const filteredLanguages = languages.filter(lang => lang.code !== selectedLanguage.code);
      setLanguages(filteredLanguages);
      
      // 5. 如果当前选中的语言被删除，需要更新当前选中的语言
      if (currentLanguage === selectedLangCode) {
        // 优先选择非CN语言，如果没有则选择CN
        const nonCnLanguage = filteredLanguages.find(lang => lang.code !== "CN");
        if (nonCnLanguage) {
          const langCode = nonCnLanguage.code === 'CN' ? 'zh' : nonCnLanguage.code === 'EN' ? 'en' : nonCnLanguage.code.toLowerCase();
          setCurrentLanguage(langCode);
        } else {
          setCurrentLanguage('zh');
        }
      }
      
      // 6. 构建要上传的数据格式（不包含被删除的语言）
      const configData: Record<string, Record<string, string>> = {};
      Object.keys(updatedContextTranslations).forEach(lang => {
        configData[lang] = {};
        const langFieldName = lang === 'zh' ? 'chinese' : lang === 'en' ? 'english' : lang.toLowerCase();
        
        updatedTranslations.forEach(item => {
          const value = item[langFieldName] as string;
          if (value) {
            configData[lang][item.key] = value;
          }
        });
      });
      
      // 7. 调用后端接口上传更新后的翻译数据
      const response = await apiRequest<{ code: number; msg: string }>('POST', '/Api/Index/saveLangConfig', {
        config: JSON.stringify(configData)
      });
      
      if (response.code === 0) {
        toast({
          title: t('language.success.deleted', '删除成功'),
          description: t('language.success.languageDeletedAndSaved', `语言 ${selectedLanguage.name} (${selectedLanguage.code}) 已成功删除并保存`)
            .replace(/{name}/g, selectedLanguage.name)
            .replace(/{code}/g, selectedLanguage.code),
        });
      } else {
        toast({
          title: t('language.success.deleted', '删除成功'),
          description: t('language.warning.deleteSaveFailed', `语言 ${selectedLanguage.name} (${selectedLanguage.code}) 已删除，但保存失败：${response.msg}`)
            .replace(/{name}/g, selectedLanguage.name)
            .replace(/{code}/g, selectedLanguage.code)
            .replace(/{msg}/g, response.msg || ''),
          variant: "destructive"
        });
      }
      
      // 关闭对话框
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting language:', error);
      toast({
        title: t('language.error.deleteFailed', '删除失败'),
        description: error.message || t('language.error.deleteFailedDescription', '删除语言失败，请稍后重试'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 处理启用/禁用翻译
  const handleToggleTranslation = (index: number) => {
    const updatedTranslations = [...translations];
    updatedTranslations[index].enabled = !updatedTranslations[index].enabled;
    setTranslations(updatedTranslations);
  };
  
  // 处理更新翻译按钮点击（仅更新本地 context，不保存到后端）
  const handleUpdateTranslation = () => {
    // 更新 context 中的翻译数据，支持所有语言
    const updatedTranslations: Record<string, Record<string, string>> = {};
    
    // 为每个语言构建翻译字典
    Object.keys(contextTranslations).forEach(langCode => {
      updatedTranslations[langCode] = { ...(contextTranslations[langCode] || {}) };
      const fieldName = langCode === 'zh' ? 'chinese' : langCode === 'en' ? 'english' : langCode.toLowerCase();
      
      translations.forEach(item => {
        const value = item[fieldName];
        if (typeof value === 'string' && value) {
          updatedTranslations[langCode][item.key] = value;
        }
      });
    });
    
    updateTranslations(updatedTranslations);
    
    toast({
      title: t('language.success.updated', '更新成功'),
      description: t('language.success.updatedDescription', '翻译已成功更新'),
    });
  };
  
  // 保存并上传翻译数据到后端
  const handleSaveTranslations = async () => {
    try {
      setIsSaving(true);
      
      // 构建要上传的数据格式，支持所有语言
      const configData: Record<string, Record<string, string>> = {};
      
      // 为每个语言构建翻译字典
      Object.keys(contextTranslations).forEach(langCode => {
        configData[langCode] = {};
        const fieldName = langCode === 'zh' ? 'chinese' : langCode === 'en' ? 'english' : langCode.toLowerCase();
        
        translations.forEach(item => {
          const value = item[fieldName] as string;
          if (value) {
            configData[langCode][item.key] = value;
          }
        });
      });
      
      // 调用后端接口上传翻译数据
      // 接口期望的数据格式：{ config: JSON.stringify({ zh: {...}, en: {...}, mm: {...} }) }
      const response = await apiRequest<{ code: number; msg: string }>('POST', '/Api/Index/saveLangConfig', {
        config: JSON.stringify(configData)
      });
      
      if (response.code === 0) {
        // 更新 context 中的翻译数据
        updateTranslations(configData);
        
        toast({
          title: t('language.success.updated', '保存成功'),
          description: response.msg || t('language.success.updatedDescription', '翻译已成功保存并上传'),
        });
      } else {
        toast({
          title: t('language.error.saveFailed', '保存失败'),
          description: response.msg || t('language.error.saveFailedDescription', '保存翻译数据失败'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error saving translations:', error);
      toast({
        title: t('language.error.saveFailed', '保存失败'),
        description: error.message || t('language.error.saveFailedDescription', '保存翻译数据失败，请稍后重试'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 渲染语言按钮（已移除，改用直接渲染CN和EN按钮）
  
  // 过滤翻译项目（支持所有语言的搜索）
  const filteredTranslations = translations.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // 搜索键
    if (item.key.toLowerCase().includes(query)) return true;
    // 搜索所有语言的值
    return Object.keys(item).some(key => {
      if (key === 'key' || key === 'enabled') return false;
      const value = item[key];
      return typeof value === 'string' && value.toLowerCase().includes(query);
    });
  });
  
  // 获取当前语言的显示名称
  const getCurrentLanguageName = () => {
    const lang = languages.find(l => {
      const langCode = l.code === 'CN' ? 'zh' : l.code === 'EN' ? 'en' : l.code.toLowerCase();
      return langCode === currentLanguage;
    });
    return lang?.name || currentLanguage.toUpperCase();
  };
  
  // 获取当前语言的值
  const getCurrentLanguageValue = (item: TranslationItem): string => {
    const fieldName = currentLanguage === 'zh' ? 'chinese' : currentLanguage === 'en' ? 'english' : currentLanguage.toLowerCase();
    return (item[fieldName] as string) || '';
  };
  
  // 获取英文对照值（只读，用于参考）
  const getEnglishReference = (item: TranslationItem): string => {
    return (item.english as string) || '';
  };
  
  // 更新当前语言的值
  const updateCurrentLanguageValue = (item: TranslationItem, value: string) => {
    const fieldName = currentLanguage === 'zh' ? 'chinese' : currentLanguage === 'en' ? 'english' : currentLanguage.toLowerCase();
    const updatedTranslations = translations.map(t => 
      t.key === item.key ? { ...t, [fieldName]: value } : t
    );
    setTranslations(updatedTranslations);
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <div className="flex items-center mb-4 sm:mb-6">
          <Languages className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('otc.nav.language', '多语言配置')}</h1>
        </div>
        
        {/* 搜索和添加区域 - 移动端优化 */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('language.search', '搜索关键词')}
              className="pl-10 bg-white border-gray-300 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline"
            className="bg-white border-gray-300 text-gray-900 flex items-center justify-center"
            onClick={handleAddLanguage}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('language.add', '添加语言')}
          </Button>
        </div>
        
        {/* 语言选择切换 - 深蓝色背景、白色文字样式 - 动态生成所有语言按钮 */}
        <div className="mb-4 overflow-x-auto">
          <div className="bg-blue-900 rounded-md p-1 flex">
            {languages.map(lang => {
              // 将显示代码转换为内部代码
              const langCode = lang.code === 'CN' ? 'zh' : lang.code === 'EN' ? 'en' : lang.code.toLowerCase();
              const isActive = currentLanguage === langCode;
              
              return (
                <Button
                  key={lang.code}
                  variant="ghost"
                  className={`${isActive 
                    ? "bg-blue-700 text-white" 
                    : "text-white hover:bg-blue-800"} rounded-sm text-sm flex-shrink-0`}
                  onClick={() => setCurrentLanguage(langCode)}
                >
                  {lang.code}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* 翻译内容区域 - 响应式布局 */}
        <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="text-gray-900 font-medium">
              {getCurrentLanguageName()} - {t('language.updateTranslation', '更新翻译')}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                <span className="text-sm text-gray-600">{t('language.enabled', '已启用')}</span>
                <Switch checked={true} />
              </div>
            </div>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {filteredTranslations.length > 0 ? (
              <>
                {/* 桌面端：表格布局 */}
                <div className="hidden md:block">
                  <table className="w-full" style={{ tableLayout: 'auto' }}>
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-[200px]">{t('language.key', '键')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700" style={{ maxWidth: '580px', width: '580px' }}>
                          {t('language.englishReference', '英文对照')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {getCurrentLanguageName()} {t('language.value', '值')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTranslations.map((item) => {
                        const currentValue = getCurrentLanguageValue(item);
                        const englishRef = getEnglishReference(item);
                        return (
                          <tr key={item.key} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-mono bg-gray-50 break-words w-[200px]">
                              {item.key}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 bg-gray-50 italic break-words" style={{ maxWidth: '580px', width: '580px' }}>
                              {englishRef || '-'}
                            </td>
                            <td className="px-4 py-3 min-w-[300px]">
                              <Input
                                value={currentValue}
                                className="bg-white border-gray-300 text-gray-900 w-full"
                                onChange={(e) => updateCurrentLanguageValue(item, e.target.value)}
                                placeholder={t('language.enterValue', '请输入值')}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* 手机端：卡片布局 */}
                <div className="md:hidden">
                  <div className="space-y-3 p-2">
                    {filteredTranslations.map((item) => {
                      const currentValue = getCurrentLanguageValue(item);
                      const englishRef = getEnglishReference(item);
                      return (
                        <div key={item.key} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                          <div className="text-xs font-medium text-gray-500 uppercase">
                            {t('language.key', '键')}
                          </div>
                          <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                            {item.key}
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase mt-3">
                            {t('language.englishReference', '英文对照')}
                          </div>
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
                            {englishRef || '-'}
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase mt-3">
                            {getCurrentLanguageName()} {t('language.value', '值')}
                          </div>
                          <Input
                            value={currentValue}
                            className="bg-white border-gray-300 text-gray-900 w-full"
                            onChange={(e) => updateCurrentLanguageValue(item, e.target.value)}
                            placeholder={t('language.enterValue', '请输入值')}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                {t('language.noResults', '没有找到匹配的翻译')}
              </div>
            )}
          </div>
        </div>
        
        {/* 底部按钮 - 移动端优化 */}
        <div className="flex justify-between items-center gap-4 mt-6">
          {/* 删除语言按钮 - 只有非中文语言显示 */}
          {currentLanguage !== "zh" && (
            <Button 
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                // 将内部代码转换为显示代码（zh -> CN, en -> EN, mm -> MM）
                const displayCode = currentLanguage === 'zh' ? 'CN' : currentLanguage === 'en' ? 'EN' : currentLanguage.toUpperCase();
                // 查找当前语言对象
                const languageToDelete = languages.find(lang => lang.code === displayCode);
                if (languageToDelete) {
                  // 设置为删除对象并打开删除对话框
                  setSelectedLanguage(languageToDelete);
                  setIsDeleteDialogOpen(true);
                } else {
                  // 如果找不到，尝试直接创建语言对象
                  const langName = languageCodeToName[displayCode] || displayCode;
                  setSelectedLanguage({ code: displayCode, name: langName });
                  setIsDeleteDialogOpen(true);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('language.deleteCurrentLanguage', '删除此语言')}
            </Button>
          )}
          
          {/* 如果是中文，添加一个占位div保持布局 */}
          {currentLanguage === "zh" && <div></div>}
          
          <Button 
            onClick={handleSaveTranslations}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('language.saving', '保存中...') : t('language.saveAll', '保存所有更改')}
          </Button>
        </div>
      </div>
      
      {/* 添加语言对话框 */}
      <AddLanguageDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddLanguageSubmit}
      />
      
      {/* 编辑语言对话框 */}
      {selectedLanguage && (
        <EditLanguageDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onEdit={handleEditLanguageSubmit}
          languageCode={selectedLanguage.code}
          languageName={selectedLanguage.name}
        />
      )}
      
      {/* 删除语言对话框 */}
      {selectedLanguage && (
        <DeleteLanguageDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onDelete={handleDeleteLanguageSubmit}
          languageCode={selectedLanguage.code}
          languageName={selectedLanguage.name}
        />
      )}
    </div>
  );
}