import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "default"
}: ConfirmDialogProps) {
  const { t } = useLanguage();
  
  // 使用默认值
  const defaultConfirmText = t('common.confirm', '确认');
  const defaultCancelText = t('common.cancel', '取消');
  
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-black">{title}</DialogTitle>
          {description && <DialogDescription className="text-gray-600">{description}</DialogDescription>}
        </DialogHeader>
        
        <DialogFooter className="sm:justify-center sm:space-x-4 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            {cancelText || defaultCancelText}
          </Button>
          <Button 
            onClick={handleConfirm}
            className={
              variant === "destructive" 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }
          >
            {confirmText || defaultConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}