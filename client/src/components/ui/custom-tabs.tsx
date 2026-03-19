import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 通用标签页类型
interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

// 货币标签页组件
interface CurrencyTabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
  onChange?: (value: string) => void;
}

// 常规标签页组件
export function CustomTabs({ 
  tabs, 
  defaultValue, 
  className = "", 
  onChange 
}: CurrencyTabsProps) {
  return (
    <Tabs 
      defaultValue={defaultValue || tabs[0]?.value} 
      className={`w-full ${className}`}
      onValueChange={onChange}
    >
      <div className="rounded-md overflow-hidden w-full">
        <div className="tab-container w-full">
          <TabsList className="bg-transparent border-0 w-full grid grid-cols-4 gap-1 p-0">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="tab-trigger"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-3">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

// 货币标签页组件
export function CurrencyTabs({ 
  tabs, 
  defaultValue, 
  className = "", 
  onChange 
}: CurrencyTabsProps) {
  return (
    <Tabs 
      defaultValue={defaultValue || tabs[0]?.value} 
      className={`w-full ${className}`}
      onValueChange={onChange}
    >
      <div className="tab-container rounded-md overflow-hidden w-full">
        <TabsList className="bg-transparent border-0 w-full grid grid-cols-4 gap-1 p-0">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="currency-tab-trigger"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}