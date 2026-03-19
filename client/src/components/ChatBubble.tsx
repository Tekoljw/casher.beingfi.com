import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/hooks/use-language';
import { Loader2 } from 'lucide-react';
import logoPath from '@assets/logo.png';

export interface ChatBubbleProps {
  content: string;
  isUser: boolean;
  timestamp?: Date;
  isLoading?: boolean;
}

export function ChatBubble({ content, isUser, timestamp, isLoading = false }: ChatBubbleProps) {
  const { t } = useLanguage();
  const date = timestamp || new Date();
  const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  
  return (
    <div className={cn(
      "flex w-full gap-3 my-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 border border-accent/20">
            <AvatarImage src={logoPath} alt="AI" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={cn(
        "flex flex-col max-w-[85%] md:max-w-[70%]",
        isUser && "items-end"
      )}>
        <div className={cn(
          "relative px-4 py-3 rounded-lg",
          isUser ? "bg-accent text-black" : "bg-gray-800 text-white",
        )}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin h-4 w-4" />
              <span>{t('integration.ai.thinking')}</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{content}</div>
          )}
        </div>
        <span className="text-xs text-gray-400 mt-1 mr-1">
          {formattedTime}
        </span>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8 bg-gray-700 border border-gray-600">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}