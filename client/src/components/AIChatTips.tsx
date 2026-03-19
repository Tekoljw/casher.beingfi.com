import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';

export function AIChatTips() {
  const { t } = useLanguage();
  
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle>{t('integration.ai.tips.title')}</CardTitle>
        <CardDescription className="text-gray-400">
          {t('integration.ai.tips.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-gray-300">
          <li className="flex gap-2">
            <span className="text-accent">•</span>
            <span>{t('integration.ai.tips.point1')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">•</span>
            <span>{t('integration.ai.tips.point2')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">•</span>
            <span>{t('integration.ai.tips.point3')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">•</span>
            <span>{t('integration.ai.tips.point4')}</span>
          </li>
        </ul>
        
        <div className="mt-4">
          <p className="text-gray-300 font-medium mb-2">{t('integration.ai.tips.examplesTitle')}</p>
          <div className="space-y-2 text-gray-400 text-sm">
            <p>{t('integration.ai.tips.example1')}</p>
            <p>{t('integration.ai.tips.example2')}</p>
            <p>{t('integration.ai.tips.example3')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}