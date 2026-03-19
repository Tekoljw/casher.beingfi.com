// client/src/components/otc/MyReports.tsx
import React, { useState, useEffect, useMemo } from "react";
import { FileText, Filter, Calendar, ArrowDown, Clock, LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import OtcLayout from "./OtcLayout";
import { useCurrencyList } from "@/hooks/use-currency-list";
import { useReportsData, ReportItem } from "@/hooks/use-reports-data"; // Import ReportItem

// 定义 User 接口 (Assuming this structure based on AdminDashboard)
interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

// 定义 SidebarItem 接口 (Assuming this structure based on AdminDashboard)
interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  submenu?: SidebarItem[];
  active?: boolean;
}

// Helper to flatten paginated data
function flattenReportsData(data: any) {
  if (!data?.pages) return [];
  // Ensure data within pages is an array before flatMap
  return data.pages.flatMap((page: any) => Array.isArray(page.data.list) ? page.data.list : []);
}

// 格式化数字为两位小数
const formatNumber = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';
  // 使用 toFixed(2) 确保显示两位小数
  return Number(num.toFixed(2)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Define the valid time range types
type TimeRange = 'month' | 'last_month' | 'year' | 'total';

export function MyReports() {
  const { t } = useLanguage();
  const [activeItem, setActiveItem] = useState("myReports");
  const [activeCurrency, setActiveCurrency] = useState<string | undefined>(undefined);
  // Use TimeRange type for state
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>('month'); // Default to 'month' for "当月"

  // 获取币种列表
  const { data: currencyList = [], isLoading: isCurrencyListLoading } = useCurrencyList();
  // const [pageNum, setPageNum] = useState(1);
  // const [pageSize, setPageSize] = useState(10);

  // 获取报表数据 (带分页)
  const {
    data: reportsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isReportsLoading,
  } = useReportsData(activeCurrency, activeTimeRange);

  // 页面加载后设置默认币种
  useEffect(() => {
    if (currencyList.length > 0 && !activeCurrency) {
      setActiveCurrency(currencyList[0].currency);
    } else if (currencyList.length === 0 && !isCurrencyListLoading) {
      // Handle case where no currencies are returned
      setActiveCurrency(undefined); // Explicitly set to undefined if list is empty
    }
  }, [currencyList, activeCurrency, isCurrencyListLoading]);

  // Flatten the paginated data for rendering
  const allReports = flattenReportsData(reportsData);

  // Calculate total row data using useMemo to optimize
  const totalData = useMemo(() => {
    const totals = {
      receive_amount: 0,
      receive_fee: 0,
      team_receive_amount: 0,
      payment_amount: 0,
      payment_fee: 0,
      team_payment_amount: 0,
      punish_amount: 0,
      team_punish_amount: 0,
      income_amount: 0,
      system_fee: 0,
    };

    allReports.forEach((report: ReportItem) => {
      // 使用 parseFloat 和 || 0 确保所有值都是数字
      totals.receive_amount += parseFloat(report.receive_amount || '0') || 0;
      totals.receive_fee += parseFloat(report.receive_fee || '0') || 0;
      totals.team_receive_amount += parseFloat(report.team_receive_amount || '0') || 0;
      totals.payment_amount += parseFloat(report.payment_amount || '0') || 0;
      totals.payment_fee += parseFloat(report.payment_fee || '0') || 0;
      totals.team_payment_amount += parseFloat(report.team_payment_amount || '0') || 0;
      totals.punish_amount += parseFloat(report.punish_amount || '0') || 0;
      totals.team_punish_amount += parseFloat(report.team_punish_amount || '0') || 0;
      totals.income_amount += parseFloat(report.income_amount || '0') || 0;
      totals.system_fee += parseFloat(report.system_fee || '0') || 0;
    });

    // 使用 formatNumber 确保所有总计值都显示为两位小数
    return {
      date: t("total"),
      receive_amount: formatNumber(totals.receive_amount),
      receive_fee: formatNumber(totals.receive_fee),
      team_receive_amount: formatNumber(totals.team_receive_amount),
      payment_amount: formatNumber(totals.payment_amount),
      payment_fee: formatNumber(totals.payment_fee),
      team_payment_amount: formatNumber(totals.team_payment_amount),
      punish_amount: formatNumber(totals.punish_amount),
      team_punish_amount: formatNumber(totals.team_punish_amount),
      income_amount: formatNumber(totals.income_amount),
      system_fee: formatNumber(totals.system_fee),
    };
  }, [allReports, t]);


  return (
    // Removed OtcLayout since MyReports is used within it in AdminDashboard
    // <OtcLayout
    //   sidebarItems={sidebarItems} // Pass actual sidebar items
    //   activeItem={activeItem}
    //   setActiveItem={setActiveItem} // Need to handle activeItem state in parent or here
    //   user={user}
    //   dashboardTitle={t('otc.nav.reports')} // Page title
    //   role="admin" // Or 'agent', depending on where this component is used
    // >
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">{t('otc.nav.reports')}</h2>

          {/* 币种选择标签 */}
          {isCurrencyListLoading ? (
             <div className="flex justify-start items-center h-8">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <Tabs
              value={activeCurrency}
              onValueChange={setActiveCurrency as any} // Use as any for now, or define stricter type for setActiveCurrency
              className="w-full mb-4"
            >
               <div className="bg-[#f5f7fa] rounded-lg overflow-hidden w-full p-1.5">
                <TabsList className="bg-transparent border-0 w-full flex justify-start gap-x-2 p-0">
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
              </div>
            </Tabs>
          )}

          {/* 时间段选择标签 */}
          <Tabs
            value={activeTimeRange}
            // Cast value to TimeRange as it comes as string from TabsTrigger
            onValueChange={(value: string) => setActiveTimeRange(value as TimeRange)}
            className="w-full mb-6"
          >
            <TabsList className="bg-[#f5f7fa] rounded-lg w-full grid grid-cols-4 gap-1 py-0.5 px-1">
              <TabsTrigger
                value="month"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
              >
                 {t("thisMonth")}
              </TabsTrigger>
              <TabsTrigger
                value="last_month"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
              >
                 {t("lastMonth")}
              </TabsTrigger>
              <TabsTrigger
                value="year"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
              >
               {t("thisYear")}
              </TabsTrigger>
              <TabsTrigger
                value="total"
                className="data-[state=active]:bg-white data-[state=active]:text-[#3b82f6] text-gray-500 rounded-lg text-xs sm:text-sm py-1 h-8 transition-all focus:outline-none"
              >
                {t("totalPeriod")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 报表数据展示区域 */}
          {/* Show initial loading spinner only if no data is loaded yet */}
          {isReportsLoading && !isFetchingNextPage? (
             <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
          ) : (
            <>
              {/* 手机端：卡片布局 */}
              <div className="md:hidden space-y-4">
                {/* Show no data message if no reports and not loading */}
                {allReports.length === 0 && !isReportsLoading && !isFetchingNextPage ? (
                  <div className="text-center text-gray-500 p-6">{t('otc.reports.noData')}</div>
                ) : (
                  <>
                    {/* 合计卡片 */}
                    <Card className="p-4 bg-gray-100 border-2 border-gray-300 shadow-sm">
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">{t("date")}</div>
                        <div className="text-gray-900 font-bold text-base">{totalData.date}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{t("collectionAmount")}</div>
                          <div className="text-gray-900 font-semibold">{totalData.receive_amount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-500 mb-1">{t("collectionFee")}</div>
                          <div className="text-blue-500 font-semibold">{totalData.receive_fee}</div>
                        </div>
                        <div>
                          <div className="text-xs text-red-500 mb-1">{t("teamCollectionCommission")}</div>
                          <div className="text-red-500 font-semibold">{totalData.team_receive_amount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{t("payoutAmount")}</div>
                          <div className="text-gray-900 font-semibold">{totalData.payment_amount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-500 mb-1">{t("payoutFee")}</div>
                          <div className="text-blue-500 font-semibold">{totalData.payment_fee}</div>
                        </div>
                        <div>
                          <div className="text-xs text-red-500 mb-1">{t("teamPayoutCommission")}</div>
                          <div className="text-red-500 font-semibold">{totalData.team_payment_amount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-red-500 mb-1">{t("timeoutDeduction")}</div>
                          <div className="text-red-500 font-semibold">{totalData.punish_amount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-500 mb-1">{t("systemFee")}</div>
                          <div className="text-blue-500 font-semibold">{totalData.team_punish_amount}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-green-500 mb-1">{t("myProfit")}</div>
                          <div className="text-green-500 font-bold text-lg">{totalData.income_amount}</div>
                        </div>
                      </div>
                    </Card>
                    
                    {/* 数据卡片 */}
                    {allReports.map((report: ReportItem, index: number) => (
                      <Card key={index} className="p-4 bg-white border border-gray-200 shadow-sm">
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">{t("date")}</div>
                          <div className="text-gray-900 font-medium">{report.date}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">{t("collectionAmount")}</div>
                            <div className="text-gray-900 font-semibold">{formatNumber(report.receive_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-500 mb-1">{t("collectionFee")}</div>
                            <div className="text-blue-500 font-semibold">{formatNumber(report.receive_fee)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-red-500 mb-1">{t("teamCollectionCommission")}</div>
                            <div className="text-red-500 font-semibold">{formatNumber(report.team_receive_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">{t("payoutAmount")}</div>
                            <div className="text-gray-900 font-semibold">{formatNumber(report.payment_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-500 mb-1">{t("payoutFee")}</div>
                            <div className="text-blue-500 font-semibold">{formatNumber(report.payment_fee)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-red-500 mb-1">{t("teamPayoutCommission")}</div>
                            <div className="text-red-500 font-semibold">{formatNumber(report.team_payment_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-red-500 mb-1">{t("timeoutDeduction")}</div>
                            <div className="text-red-500 font-semibold">{formatNumber(report.punish_amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-blue-500 mb-1">{t("systemFee")}</div>
                            <div className="text-blue-500 font-semibold">{formatNumber(report.team_punish_amount)}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs text-green-500 mb-1">{t("myProfit")}</div>
                            <div className="text-green-500 font-bold">{formatNumber(report.income_amount)}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
                
                {/* 加载更多按钮 - 手机端 */}
                {hasNextPage && (
                  isFetchingNextPage ? (
                    <div className="flex justify-center items-center h-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                      >
                        {t('loadMore')}
                      </Button>
                    </div>
                  )
                )}
              </div>
              
              {/* 桌面端：表格布局 */}
              <div className="hidden md:block overflow-x-auto bg-[#f8fafc] rounded-md">
                {/* Show no data message if no reports and not loading */}
                {allReports.length === 0 && !isReportsLoading && !isFetchingNextPage ? (
                  <div className="text-center text-gray-500 p-6">{t('otc.reports.noData')}</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200 bg-gray-50 text-left">
                        <th className="py-3 px-4 text-sm font-medium text-gray-500">{t("date")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500">{t("collectionAmount")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-blue-500">{t("collectionFee")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-red-500">{t("teamCollectionCommission")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500">{t("payoutAmount")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-blue-500">{t("payoutFee")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-red-500">{t("teamPayoutCommission")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-red-500">{t("timeoutDeduction")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-blue-500">{t("systemFee")}</th>
                        <th className="py-3 px-4 text-sm font-medium text-green-500">{t("myProfit")}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* 合计行 */}
                      <tr className="bg-gray-100 font-semibold">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{totalData.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{totalData.receive_amount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-500">{totalData.receive_fee}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">{totalData.team_receive_amount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{totalData.payment_amount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-500">{totalData.payment_fee}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">{totalData.team_payment_amount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">{totalData.punish_amount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-500">{totalData.team_punish_amount}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-green-500">{totalData.income_amount}</td>
                      </tr>
                      {/* 数据行 */}
                      {allReports.map((report: ReportItem, index: number) => (
                        <tr
                          key={index}
                          className={cn(
                            "border-b border-gray-200",
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          )}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{report.date}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatNumber(report.receive_amount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-500">{formatNumber(report.receive_fee)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">{formatNumber(report.team_receive_amount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatNumber(report.payment_amount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-500">{formatNumber(report.payment_fee)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">{formatNumber(report.team_payment_amount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500">{formatNumber(report.punish_amount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-500">{formatNumber(report.team_punish_amount)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-green-500">{formatNumber(report.income_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 加载更多按钮 - 桌面端 */}
                {hasNextPage && (
                  isFetchingNextPage ? (
                    <div className="flex justify-center items-center h-10 mt-4 pb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="flex justify-center mt-4 pb-4">
                      <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        {t('loadMore')}
                      </Button>
                    </div>
                  )
                )}
              </div>
            </>
          )}


        </div>
      </div>
    // </OtcLayout> // Removed extra div closure and OtcLayout
  );
}