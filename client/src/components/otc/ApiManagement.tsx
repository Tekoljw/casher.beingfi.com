
import React, { useState, useEffect } from "react";
import { Code, Copy, ArrowLeft, ArrowRight } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { ApiLogsDataItem, useApiLogsData } from '@/hooks/use-apiLogs-data'
import { useSettingData } from '@/hooks/use-setting-data'
import { useCurrencyList } from "@/hooks/use-currency-list";
import { apiRequest } from "@/lib/queryClient";



function flattenReportsData(data: any) {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => Array.isArray(page.data.list) ? page.data.list : []);
}


export function ApiManagement() {
  const [activeTab, setActiveTab] = useState("keys");
  const [isDocumentationExpanded, setIsDocumentationExpanded] = useState(false);
  const [copyText, setCopyText] = useState<{ [key: string]: string }>({
    production: "Copy",
    test: "Copy"
  });
  const { t } = useLanguage();
  const { toast } = useToast();

  const [activeCurrency, setActiveCurrency] = useState<string>('');
  const [ipCallbackWhitelist, setIpCallbackWhitelist] = useState('');
  const [ipMonitorWhitelist, setIpMonitorWhitelist] = useState('');
  const [isSavingCallback, setIsSavingCallback] = useState(false);
  const [isSavingMonitor, setIsSavingMonitor] = useState(false);

  const otcRole = localStorage.getItem('otcRole') || '1';

  // 获取币种对象数组（用于币种tab）
  const { data: currencyList = [], isLoading: isCurrencyLoading } = useCurrencyList();

  // 获取仪表盘数据，activeCurrency变化时自动请求
  const {
    data: settingData,
    isLoading: isSettingLoading,
    refetch
  } = useSettingData(activeCurrency);

  // 页面加载后设置默认币种
  useEffect(() => {
    if (currencyList.length > 0 && !activeCurrency) {
      setActiveCurrency(currencyList[0].currency);
    }
  }, [currencyList, activeCurrency]);

  // 初始化 IP 白名单的值
  useEffect(() => {
    if (settingData?.pages?.[0]?.data?.ip) {
      setIpCallbackWhitelist(settingData.pages[0].data.ip.callback || '');
      setIpMonitorWhitelist(settingData.pages[0].data.ip.payment || '');
    }
  }, [settingData]);

  // 获取报表数据 (带分页)
  const {
    data: apiLogsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isApiLogsLoading,
  } = useApiLogsData();



  const allReports = flattenReportsData(apiLogsData);
  const apiKey: any = settingData?.pages[0]?.data?.api || {};

  // 复制到剪贴板的函数
  const copyToClipboard = (text: string, keyType: "production" | "test") => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopyText({ ...copyText, [keyType]: "Copied!" });
        setTimeout(() => {
          setCopyText({ ...copyText, [keyType]: "Copy" });
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setCopyText({ ...copyText, [keyType]: "Failed" });
        setTimeout(() => {
          setCopyText({ ...copyText, [keyType]: "Copy" });
        }, 2000);
      });
  };

  // 生成新的API密钥
  const regenerateApiKey = (keyType: "production" | "test") => {
    // 实际应用中这里会调用API生成新的密钥
    console.log(`Regenerating ${keyType} API key...`);
  };

  const saveIpWhitelist = async (type: number) => {
    try {
      if (type === 1) {
        setIsSavingCallback(true);
      } else {
        setIsSavingMonitor(true);
      }
      
      const ip = type === 1 ? ipCallbackWhitelist : ipMonitorWhitelist;
      
      const result = await apiRequest('POST', '/Api/Index/editIP', {
        type,
        ip
      });

      if (result.code === 0) {
        toast({
          title: t('otc.api.toast.operationSuccess'),
          description: t('otc.api.toast.saveSuccess'),
        });
        refetch();
      } else {
        toast({
          title: t('otc.api.toast.operationFailed'),
          description: result.msg || t('otc.api.toast.saveFailed'),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('保存IP白名单错误:', error);
      toast({
        title: t('otc.api.toast.operationFailed'),
        description: error.message || t('otc.api.toast.saveFailedRetry'),
        variant: "destructive",
      });
    } finally {
      if (type === 1) {
        setIsSavingCallback(false);
      } else {
        setIsSavingMonitor(false);
      }
    }
  };

  return (
    <div className="bg-white">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Code className="h-6 w-6 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">{t('otc.api.title')}</h1>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-[#f5f7fa] rounded-lg w-full grid grid-cols-3 gap-1 py-0.5 px-1 mb-6">
            <TabsTrigger
              value="keys"
              className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
            >
              {t('otc.api.keys')}
            </TabsTrigger>
            { otcRole === '1' && <TabsTrigger
              value="whitelist"
              className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
            >
              {t('otc.api.whitelist')}
            </TabsTrigger>
            }
            <TabsTrigger
              value="documentation"
              className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
            >
              {t('otc.api.documentation')}
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
            >
              {t('otc.api.logs')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="mt-0">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('otc.api.management')}</h2>
               <Tabs value={activeCurrency} onValueChange={setActiveCurrency} className="w-full">
                  <TabsList className="bg-[#f5f7fa] rounded-lg w-full grid grid-cols-4 gap-1 py-0.5 px-1 mb-4">
                    {currencyList.map(item => (
                      <TabsTrigger
                        key={item.currency}
                        value={item.currency}
                        className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
                      >
                        {item.currency}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <TabsContent value={activeCurrency}>
                    <div className="space-y-6">
                      {/* Production API Key */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">{t('otc.api.production')}</h3>
                        <div className="flex space-x-2">
                          <Input
                            readOnly
                            type="password"
                            value={apiKey?.key}
                            className="font-mono bg-gray-50"
                            style={{ color: "#000" }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(apiKey?.key, "production")}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {copyText.production === "Copy" ? t('otc.api.copy') :
                              copyText.production === "Copied!" ? t('otc.api.copied') :
                                t('otc.api.failed')}
                          </Button>
                        </div>
                      </div>

                      {/* Test API Key */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">{t('otc.api.test')}</h3>
                        <div className="flex space-x-2">
                          <Input
                            readOnly
                            type="password"
                            value={apiKey['test-key']}
                            className="font-mono bg-gray-50"
                            style={{ color: "#000" }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(apiKey['test-key'], "test")}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {copyText.test === "Copy" ? t('otc.api.copy') :
                              copyText.test === "Copied!" ? t('otc.api.copied') :
                                t('otc.api.failed')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="documentation" className="mt-0">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('otc.api.documentation')}</h2>
              
              {/* 目录导航 */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{t('otc.api.documentation.tableOfContents')}</h3>
                  {!isDocumentationExpanded && (
                    <Button 
                      onClick={() => setIsDocumentationExpanded(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {t('otc.api.documentation.viewMore')}
                    </Button>
                  )}
                </div>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="#api-basic-info" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-basic-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.basicInfo')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-signature" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-signature')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.signature')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-payment" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-payment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.payment')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-payout" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-payout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.payout')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-set-return-order-id" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-set-return-order-id')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.setReturnOrderId')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-payment-callback" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-payment-callback')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.callback')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-order-status" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-order-status')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.orderStatus')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-external-order-sync" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-external-order-sync')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.externalOrderSync')}
                    </a>
                  </li>
                  <li>
                    <a 
                      href="#api-currency-channel" 
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDocumentationExpanded(true);
                        setTimeout(() => {
                          document.getElementById('api-currency-channel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      {t('otc.api.documentation.currencyChannel')}
                    </a>
                  </li>
                </ul>
              </div>

              {isDocumentationExpanded && (
              <div className="prose max-w-none space-y-8">
                {/* 基本信息 */}
                <div id="api-basic-info" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.basicInfo')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="space-y-3">
                      <p className="mb-2"><strong className="text-gray-700">{t('otc.api.documentation.requestGateway')}</strong><span className="text-gray-900 font-mono text-sm">https://otc.beingfi.com/</span></p>
                      <p className="mb-2"><strong className="text-gray-700">{t('otc.api.documentation.requestMethod')}</strong><span className="text-gray-900">POST</span></p>
                      <p className="mb-2"><strong className="text-gray-700">{t('otc.api.documentation.dataFormat')}</strong><span className="text-gray-900">Form-Data</span></p>
                    </div>
                  </div>
                </div>

                {/* 签名算法 */}
                <div id="api-signature" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.signature')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <p className="mb-4 text-gray-700">
                      {t('otc.api.documentation.signatureSteps')}
                    </p>
                    <div className="mb-6 space-y-3">
                      <div className="pl-4 border-l-4 border-blue-500">
                        <p className="mb-2"><strong>{t('otc.api.documentation.step1')}</strong>设所有发送或者接收到的数据为集合M，将集合M内非空参数值的参数按照参数名ASCII码从小到大排序（a-z字典序），使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA。</p>
                      </div>
                      <div className="pl-4 border-l-4 border-blue-500">
                        <p className="mb-2"><strong>{t('otc.api.documentation.step2')}</strong>在stringA最后拼接上应用(ApiKey)得到stringSignTemp字符串，并对stringSignTemp进行MD5运算，再将得到的字符串所有字符转换为大写，得到sign值signValue。</p>
                      </div>
                    </div>
                    <div className="mt-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paymentExample')}</p>
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.concatString')}</p>
                        <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
                          stringSignTemp="agentid=agentid&amount=amount&channelid=channelid&cointype=cointype&noticestr=noticestr&notifyurl=notifyurl&orderid=orderid&payment_orderid=payment_orderid&userid=userid&key=Apikey"
                        </pre>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.generateMd5')}</p>
                        <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
                          sign=MD5(stringSignTemp).toUpperCase()
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 代收接口 */}
                <div id="api-payment" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.payment')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/pay/PayParams</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">agentid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">channelid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">渠道ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payment_orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.optional')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商户订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">cointype</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">币种</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">金额，保留2位小数</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">notifyurl</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">异步通知地址</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "mch_id": "09267767001",
        "signkey": "09267767001",
        "appid": "09267767001",
        "appsecret": "",
        "domain_record": "",
        "subject": "Wave+Money",
        "truename": "Ye Tun Oo",
        "qrcode": "https://otc.beingfi.com/Upload/public/68f367265d86e.jpg",
        "out_order_id": "2025110723020610154524",
        "real_amount": "0.00",
        "noticestr": "uywK41Y3a6paBsnHzVkgU1ssDTjF4p6y",
        "sign": "CB066BB77E20D07634986A024BA5D819"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mch_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">signkey</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">appid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">appsecret</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">密钥</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">domain_record</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">域名</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">subject</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款方式</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">truename</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款人姓名</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">qrcode</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">二维码</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">out_order_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">real_amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">真实支付金额</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 代付接口 */}
                <div id="api-payout" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.payout')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/Pay/PayParams/autoSellC2COrder.html</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">agentid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">channelid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">渠道ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payment_orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.optional')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商户订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">cointype</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">币种</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">truename</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款人姓名</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">bank</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款银行</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">bankcard</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账户</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">金额，保留2位小数</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">fee</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">手续费，保留2位小数</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">notifyurl</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">异步通知地址</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "out_order_id": "2025110723134254495398",
        "noticestr": "FI3SrFz1E1lH83deqjZPJ9eh0iS14AlI",
        "sign": "6E4365C47B16F808702C38D18C43AD1B"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">out_order_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 设置代收唯一标识接口 */}
                <div id="api-set-return-order-id" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.setReturnOrderId')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/Pay/PayParams/setOTCOrderReturnOrderId.html</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">agentid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">pay_proof</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付截图</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">return_bank_name</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">付款银行</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">return_account_name</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">付款人姓名</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">return_order_id</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">根据通道选择传递</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">唯一标识</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": []
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* 代收 / 代付 回调通知 */}
                <div id="api-payment-callback" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.callback')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.notificationMethod')}</p>
                      <p className="mb-2 text-gray-700">POST</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.notificationFormat')}</p>
                      <p className="mb-2 text-gray-700">Content-Type: application/x-www-form-urlencoded</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.notificationParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">金额，保留2位小数</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">用户ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">status</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">状态，2 代表成功；3 代表失败</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.important')}</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                          <li>接收到服务器点对点通讯时，在页面输出"ok"</li>
                          <li>请务必进行结果的sign验证，确保正确性</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 查询订单状态接口 */}
                <div id="api-order-status" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.orderStatus')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/Pay/PayParams/getOTCC2COrderStatus.html</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "order_status": -1,
        "noticestr": "d3Tl125jNiFJXiEFOJTLmvSF70P2Rgld",
        "sign": "B7C2612C1DD4B69B62A760154B663A30"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">order_status</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单状态，-1订单不存在，0 未处理，1处理中，2待确认，3成功，4失败</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 外部订单同步接口 */}
                <div id="api-external-order-sync" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.externalOrderSync')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="mb-6">
                      <p className="mb-2 text-sm text-gray-600"><strong className="text-gray-900">{t('otc.api.documentation.endpoint')}</strong></p>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">网关/pay/PayOutOrder</p>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.requestParams')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.type')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">供应商ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">otype</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单类型，1 代付；2 代收</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payOrderId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">appId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统应用ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchOrderNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户传入的订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchUserId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户平台用户ID</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">ifCode</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付接口编码</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">wayCode</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付方式</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单金额（保留2位小数）</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amountActual</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">实际支付金额（保留2位小数）</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchFeeAmount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商户手续费金额（保留2位小数）</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">currency</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">货币代码</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">state</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付订单状态：0-订单生成；1-支付中；2-支付成功；3-支付失败；4-已撤销；5-已退款；6-订单关闭</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">userBorneRates</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">用户是否承担费率：0-不承担；1-承担</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">clientIp</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">客户端IP</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">subject</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商品标题</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">body</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">商品描述</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">createdAt</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">创建时间，13位时间戳</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">successTime</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">成功时间，13位时间戳</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">reqTime</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">通知请求时间，13位时间戳</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">bankName</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">代付订单必传</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款银行名称，代付订单必传</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">accountName</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">代付订单必传</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款人姓名，代付订单必传</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">accountNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">代付订单必传</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">收款账号，代付订单必传</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">{t('otc.api.documentation.required')}</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.response')}</p>
                      <p className="mb-2 text-sm font-medium text-gray-900">{t('otc.api.documentation.example')}</p>
                      <pre className="p-4 rounded-md text-sm overflow-x-auto bg-gray-50 border border-gray-200 font-mono text-gray-900">
{`{
    "status": "success",
    "msg": "成功",
    "data": {
        "mchNo": null,
        "orderid": "2025110723434099544810",
        "payOrderId": "P12021022311124442600",
        "amount": "100.00",
        "status": "0",
        "currency": "MMK",
        "noticestr": "ElzbP9kyK5gGtb5B5loRo63zjFq5Rxwv",
        "sign": "4EC9657700B3A27ACB2605ADDC2F32D6"
    }
}`}
                      </pre>
                    </div>

                    <div>
                      <p className="mb-3 font-medium text-gray-900">{t('otc.api.documentation.paramDescription')}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.paramName')}</th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{t('otc.api.documentation.description')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">mchNo</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统商户号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">orderid</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">平台订单号</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">payOrderId</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">支付系统订单号</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">amount</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单金额</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">status</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">订单状态</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">currency</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">币种</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">noticestr</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">随机字符串</td>
                            </tr>
                            <tr className="bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 font-mono text-gray-900">sign</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-700">签名</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 币种及通道 */}
                <div id="api-currency-channel" className="scroll-mt-4">
                  <div className="border-b border-gray-300 pb-3 mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{t('otc.api.documentation.currencyChannel')}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-gray-700">{t('otc.api.documentation.contactBusiness')}</p>
                  </div>
                </div>

              </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('otc.api.requestLogs')}</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left">
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.api.table.timestamp')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.api.table.endpoint')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.api.table.method')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.api.table.status')}</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">{t('otc.api.table.responseTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReports.map((apiLogs: ApiLogsDataItem, index: any) => (
                      <tr
                        key={index}
                        className={cn(
                          "border-b border-gray-200",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        )}
                      >
                        <td className="py-3 px-4 text-sm text-gray-900">{new Date(Number(apiLogs.addtime) * 1000).toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-900">{apiLogs.endpoint}</td>
                        <td className={cn(
                          "py-3 px-4 text-sm font-medium",
                          apiLogs.method === "GET" ? "text-blue-600" :
                            apiLogs.method === "POST" ? "text-green-600" :
                              apiLogs.method === "PUT" ? "text-amber-600" :
                                "text-red-600"
                        )}>
                          {apiLogs.method}
                        </td>
                        <td className={cn(
                          "py-3 px-4 text-sm font-medium",
                          Number(apiLogs.response_status) >= 200 && Number(apiLogs.response_status) < 300 ? "text-green-600" :
                            Number(apiLogs.response_status) >= 400 && Number(apiLogs.response_status) < 500 ? "text-amber-600" :
                              "text-red-600"
                        )}>
                          {apiLogs.response_status}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{apiLogs.response_time}{"ms"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>



              {/* 加载更多按钮 */}
              {hasNextPage && (
                 // Show loading spinner when fetching next page
                 isFetchingNextPage ? (
                   <div className="flex justify-center items-center h-10 mt-4 pb-4">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                   </div>
                 ) : (
                  <div className="flex justify-center mt-4 pb-4">
                    <Button
                      onClick={() => fetchNextPage()} // Corrected onClick handler
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50" // Added classes based on original button
                    >
                      {t('loadMore')}
                    </Button>
                  </div>
                )
              )}

            </div>
          </TabsContent>

          <TabsContent value="whitelist" className="mt-0">
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('otc.api.whitelist')}</h2>
              <div className="space-y-6">
                {/* 回调IP配置 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">{t('otc.api.callbackWhitelist')}</h3>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={ipCallbackWhitelist}
                      className="font-mono bg-white"
                      style={{ color: "#000" }}
                      onChange={(e) => setIpCallbackWhitelist(e.target.value)}
                      placeholder=""
                    />
                    <Button
                      variant="outline"
                      onClick={() => saveIpWhitelist(1)}
                      disabled={isSavingCallback || !ipCallbackWhitelist}
                    >
                      {isSavingCallback ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                </div>

                {/* 监控IP配置 */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">{t('otc.api.monitorWhitelist')}</h3>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      value={ipMonitorWhitelist}
                      className="font-mono bg-white"
                      style={{ color: "#000" }}
                      onChange={(e) => setIpMonitorWhitelist(e.target.value)}
                      placeholder=""
                    />
                    <Button
                      variant="outline"
                      onClick={() => saveIpWhitelist(2)}
                      disabled={isSavingMonitor || !ipMonitorWhitelist}
                    >
                      {isSavingMonitor ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
