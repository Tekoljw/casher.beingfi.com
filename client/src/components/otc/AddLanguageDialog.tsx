import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

interface AddLanguageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (code: string) => void;
}

export default function AddLanguageDialog({ isOpen, onOpenChange, onAdd }: AddLanguageDialogProps) {
  const [languageCode, setLanguageCode] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const handleSubmit = () => {
    // 验证输入
    if (!languageCode.trim()) {
      toast({
        title: t('language.error.validation', '验证错误'),
        description: t('language.error.codeRequired', '请输入语言代码'),
        variant: "destructive"
      });
      return;
    }
    
    // 调用添加函数
    onAdd(languageCode.trim().toUpperCase());
    
    // 清空并关闭
    setLanguageCode("");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{t('language.dialog.addTitle', '添加语言')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('language.dialog.addDescription', '添加新的可用语言以支持多语言翻译')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="languageCode" className="block text-sm font-medium text-gray-700">
              {t('language.dialog.code', '语言代码')}
            </label>
            <input 
              id="languageCode"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              placeholder={t('language.dialog.codePlaceholder', '如: EN, CN')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900"
            />
            <p className="text-xs text-gray-500">
              {t('language.dialog.codeHelp', '使用简短的代码标识语言，如 EN, CN')}
            </p>
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
            {t('language.dialog.add', '添加')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}