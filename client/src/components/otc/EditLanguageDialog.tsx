import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

interface EditLanguageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (oldCode: string, newCode: string, newName: string) => void;
  languageCode: string;
  languageName: string;
}

export default function EditLanguageDialog({ 
  isOpen, 
  onOpenChange, 
  onEdit, 
  languageCode, 
  languageName 
}: EditLanguageDialogProps) {
  const [code, setCode] = useState(languageCode);
  const [name, setName] = useState(languageName);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // 当传入的语言代码和名称变化时更新状态
  useEffect(() => {
    setCode(languageCode);
    setName(languageName);
  }, [languageCode, languageName]);
  
  const handleSubmit = () => {
    // 验证输入
    if (!code.trim()) {
      toast({
        title: t('language.error.validation', '验证错误'),
        description: t('language.error.codeRequired', '请输入语言代码'),
        variant: "destructive"
      });
      return;
    }
    
    if (!name.trim()) {
      toast({
        title: t('language.error.validation', '验证错误'),
        description: t('language.error.nameRequired', '请输入语言名称'),
        variant: "destructive"
      });
      return;
    }
    
    // 调用编辑函数
    onEdit(languageCode, code, name);
    
    // 关闭对话框
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{t('language.dialog.editTitle', '编辑语言')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('language.dialog.editDescription', '修改语言信息')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="languageCode" className="block text-sm font-medium text-gray-700">
              {t('language.dialog.code', '语言代码')}
            </label>
            <input 
              id="languageCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('language.dialog.codePlaceholder', '如: EN, CN')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
            <p className="text-xs text-gray-500">
              {t('language.dialog.codeHelp', '使用简短的代码标识语言，如 EN, CN')}
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="languageName" className="block text-sm font-medium text-gray-700">
              {t('language.dialog.name', '语言名称')}
            </label>
            <input 
              id="languageName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('language.dialog.namePlaceholder', '如: 英语, 中文')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end gap-2 flex flex-col-reverse sm:flex-row">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 w-full sm:w-auto"
          >
            {t('common.cancel', '取消')}
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            {t('common.save', '保存')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}