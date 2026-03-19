import React, { ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => void;
  isDisabled?: boolean;
}

export function ChatInput({ message, setMessage, onSend, isDisabled = false }: ChatInputProps) {
  const { t } = useLanguage();
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isDisabled) {
      onSend();
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
      <Input 
        value={message}
        onChange={handleChange}
        placeholder={t('integration.ai.inputPlaceholder')}
        className="bg-gray-800 border-gray-700 focus:border-accent focus:ring-accent text-white placeholder:text-gray-400"
        disabled={isDisabled}
      />
      <Button 
        type="submit" 
        size="icon" 
        className="bg-accent hover:bg-accent/90 text-black h-10 w-10"
        disabled={!message.trim() || isDisabled}
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}