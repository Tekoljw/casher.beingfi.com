import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

interface DeleteLanguageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  languageCode: string;
  languageName: string;
}

export default function DeleteLanguageDialog({
  isOpen,
  onOpenChange,
  onDelete,
  languageCode,
  languageName
}: DeleteLanguageDialogProps) {
  const { t } = useLanguage();
  
  const handleConfirm = () => {
    onDelete();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{t('language.dialog.deleteTitle', '删除语言')}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {t('language.dialog.deleteDescription', '此操作将删除语言及所有相关翻译，无法恢复。')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            {t('language.dialog.deleteConfirm', '确定要删除以下语言吗？')}
          </p>
          <div className="mt-2 p-3 bg-gray-100 rounded-md">
            <p className="font-medium text-gray-900">{languageName} ({languageCode})</p>
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
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
          >
            {t('common.delete', '删除')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}