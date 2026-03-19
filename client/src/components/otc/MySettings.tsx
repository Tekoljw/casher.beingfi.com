import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyList } from '@/hooks/use-currency-list';
import { useSettingData } from '@/hooks/use-setting-data';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

export function MySettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeConfigTab, setActiveConfigTab] = useState<"commission" | "browser" | "vmos">("commission");
  const [activeCurrency, setActiveCurrency] = useState<string>('');

  // 获取币种对象数组（用于币种tab）
  const { data: currencyList = [], isLoading: isCurrencyLoading } = useCurrencyList();

  // 页面加载后设置默认币种
  useEffect(() => {
    if (currencyList.length > 0 && !activeCurrency) {
      setActiveCurrency(currencyList[0].currency);
    }
  }, [currencyList, activeCurrency]);

  // 使用自定义 Hook 获取配置数据
  const {
    data: settingData,
    isLoading: isSettingLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSettingData(activeCurrency);

  // 合并所有页面的数据
  const allFeeData = settingData?.pages.flatMap(page => 
    page.data.fee[activeCurrency]?.list || []
  ) || [];

  // Browserbase 配置
  const [browserbaseKey, setBrowserbaseKey] = useState("");
  const [browserbaseProjectId, setBrowserbaseProjectId] = useState("");
  const [isLoadingBrowserConfig, setIsLoadingBrowserConfig] = useState(false);
  const [isSavingBrowserConfig, setIsSavingBrowserConfig] = useState(false);
  const [hasLoadedBrowserConfig, setHasLoadedBrowserConfig] = useState(false);

  const loadBrowserbaseConfig = async () => {
    setIsLoadingBrowserConfig(true);
    try {
      const res = await apiRequest<any>("POST", "/Api/Index/getUserWebsiteConfig", {});
      const data = (res as any)?.data || {};
      setBrowserbaseKey(data.browserbase_key || "");
      setBrowserbaseProjectId(data.browserbase_projectid || "");
      setHasLoadedBrowserConfig(true);
    } catch (e: any) {
      toast({
        title: "加载失败",
        description: e?.message || "请求失败",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBrowserConfig(false);
    }
  };

  const saveBrowserbaseConfig = async () => {
    setIsSavingBrowserConfig(true);
    try {
      const res = await apiRequest<any>("POST", "/Api/Index/setUserWebsiteConfig", {
        browserbase_key: browserbaseKey,
        browserbase_projectid: browserbaseProjectId,
      });
      if ((res as any)?.code === 0 || (res as any)?.code === undefined) {
        toast({ title: "保存成功" });
        await loadBrowserbaseConfig();
      } else {
        toast({
          title: "保存失败",
          description: (res as any)?.msg || "请求失败",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "保存失败",
        description: e?.message || "请求失败",
        variant: "destructive",
      });
    } finally {
      setIsSavingBrowserConfig(false);
    }
  };

  useEffect(() => {
    if (activeConfigTab === "browser" && !hasLoadedBrowserConfig && !isLoadingBrowserConfig) {
      loadBrowserbaseConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConfigTab]);

  return (
    <div className="bg-white">
      <div className="p-4 sm:p-6">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">{t('otc.nav.config')}</h1>
        </div>

        {/* 顶部标签（与 API管理 风格一致） */}
        <Tabs value={activeConfigTab} onValueChange={(v) => setActiveConfigTab(v as any)} className="w-full">
          <TabsList className="bg-[#f5f7fa] rounded-lg w-full grid grid-cols-3 gap-1 py-0.5 px-1 mb-6">
            <TabsTrigger
              value="commission"
              className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
            >
              佣金配置
            </TabsTrigger>
            <TabsTrigger
              value="browser"
              className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
            >
              浏览器配置
            </TabsTrigger>
            <TabsTrigger
              value="vmos"
              className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
            >
              VMOS云手机配置
            </TabsTrigger>
          </TabsList>

          {/* 佣金配置 */}
          <TabsContent value="commission" className="mt-0">
            {/* 手续费比例区域 */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('otc.settings.myCommissionConfig')}</h2>

              <Tabs value={activeCurrency} onValueChange={setActiveCurrency} className="w-full">
                <div className="bg-[#f5f7fa] rounded-lg p-1 mb-4 overflow-x-auto">
                  <TabsList className="bg-transparent border-0 inline-flex min-w-max gap-1">
                    {currencyList.map(item => (
                      <TabsTrigger
                        key={item.currency}
                        value={item.currency}
                        className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none flex-shrink-0"
                      >
                        {item.currency}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                <TabsContent value={activeCurrency}>
                  <div className="bg-white rounded-md overflow-hidden">
                    {/* 手机端：卡片布局 */}
                    <div className="md:hidden space-y-4">
                      {isSettingLoading ? (
                        <div className="flex justify-center items-center h-40">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : allFeeData.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">{t('otc.settings.noData')}</div>
                      ) : (
                        allFeeData.map((item) => (
                          <Card key={item.channelid} className="p-4 bg-white border border-gray-200 shadow-sm">
                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-1">{t('otc.settings.accountType')}</div>
                              <div className="text-gray-900 font-medium">{item.channel_name}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('otc.settings.collectionCommission')}</div>
                                <div className="text-gray-900 font-semibold">{item.receive_commission}%</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1">{t('otc.settings.payoutCommission')}</div>
                                <div className="text-gray-900 font-semibold">{item.payment_commission}%</div>
                              </div>
                              <div className="col-span-2">
                                <div className="text-xs text-gray-500 mb-1">{t('otc.settings.timeoutOrderDeductionFee')}</div>
                                <div className="text-gray-900 font-semibold">{item.punish_commission}%</div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                      
                      {/* 加载更多按钮 - 手机端 */}
                      {hasNextPage && (
                        <div className="flex justify-center">
                          <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            variant="outline"
                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                          >
                            {isFetchingNextPage ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                {t('otc.settings.loading')}
                              </div>
                            ) : (
                              t('otc.settings.loadMore')
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
    
                    {/* 桌面端：表格布局 */}
                    <div className="hidden md:block">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-left">
                            <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.settings.accountType')}</th>
                            <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.settings.collectionCommission')}</th>
                            <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.settings.payoutCommission')}</th>
                            <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.settings.timeoutOrderDeductionFee')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isSettingLoading ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center">
                                <div className="flex justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                </div>
                              </td>
                            </tr>
                          ) : allFeeData.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-gray-500">
                                {t('otc.settings.noData')}
                              </td>
                            </tr>
                          ) : (
                            allFeeData.map((item, index) => (
                              <tr
                                key={item.channelid}
                                className={cn(
                                  "border-b border-gray-200",
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                )}
                              >
                                <td className="py-3 px-4 text-sm text-gray-900">{item.channel_name}</td>
                                <td className="py-3 px-4 text-sm text-gray-900">{item.receive_commission}%</td>
                                <td className="py-3 px-4 text-sm text-gray-900">{item.payment_commission}%</td>
                                <td className="py-3 px-4 text-sm text-gray-900">{item.punish_commission}%</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
    
                      {/* 加载更多按钮 - 桌面端 */}
                      {hasNextPage && (
                        <div className="flex justify-center mt-4 pb-4">
                          <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            variant="outline"
                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            {isFetchingNextPage ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                {t('otc.settings.loading')}
                              </div>
                            ) : (
                              t('otc.settings.loadMore')
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* 浏览器配置 */}
          <TabsContent value="browser" className="mt-0">
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="text-lg font-semibold text-gray-900">浏览器配置</h2>
                <Button
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={loadBrowserbaseConfig}
                  disabled={isLoadingBrowserConfig}
                >
                  {isLoadingBrowserConfig ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      加载中
                    </div>
                  ) : (
                    "刷新"
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="browserbase_key" className="text-gray-700">BROWSERBASE_API_KEY</Label>
                  <Input
                    id="browserbase_key"
                    value={browserbaseKey}
                    onChange={(e) => setBrowserbaseKey(e.target.value)}
                    className="bg-white text-gray-900 font-mono"
                    placeholder="请输入 BROWSERBASE_API_KEY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="browserbase_projectid" className="text-gray-700">BROWSERBASE_PROJECT_ID</Label>
                  <Input
                    id="browserbase_projectid"
                    value={browserbaseProjectId}
                    onChange={(e) => setBrowserbaseProjectId(e.target.value)}
                    className="bg-white text-gray-900 font-mono"
                    placeholder="请输入 BROWSERBASE_PROJECT_ID"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={saveBrowserbaseConfig}
                  disabled={isSavingBrowserConfig}
                >
                  {isSavingBrowserConfig ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* VMOS云手机配置 */}
          <TabsContent value="vmos" className="mt-0">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">VMOS云手机配置</h2>
              <div className="text-gray-500">待配置</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}