import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2, 
  Wallet,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [rechargeAmount, setRechargeAmount] = useState<number>(10);

  // 注释掉不存在的接口查询
  // const { data: userData, isLoading: isUserLoading } = useQuery<any>({
  //   queryKey: ["/api/user-info"],
  //   enabled: !!user,
  // });
  
  // 使用本地状态或从localStorage获取用户数据
  const [userData, setUserData] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);

  // 用户交易记录查询
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // 用户集成项目查询
  const { data: projects, isLoading: isProjectsLoading } = useQuery<any[]>({
    queryKey: ["/api/integration-projects"],
    enabled: !!user,
  });

  // 充值
  const rechargeMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/recharge", { amount });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "充值成功",
        description: `已成功充值 ${rechargeAmount} USDT`,
      });
      
      // 更新余额
      // 注释掉不存在的接口调用
      // queryClient.invalidateQueries({ queryKey: ["/api/user-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      setRechargeAmount(10); // 重置充值金额
    },
    onError: (error: Error) => {
      toast({
        title: "充值失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRecharge = () => {
    if (rechargeAmount <= 0) {
      toast({
        title: "充值金额无效",
        description: "请输入大于0的金额",
        variant: "destructive",
      });
      return;
    }
    
    rechargeMutation.mutate(rechargeAmount);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      <Header />
      
      {/* 顶部彩带 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">个人中心</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 账户信息卡片 */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">用户名</span>
                  <span className="text-white">{userData?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">电子邮箱</span>
                  <span className="text-white">{userData?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">注册时间</span>
                  <span className="text-white">{formatDate(userData?.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* 账户余额卡片 */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>账户余额</CardTitle>
                <CardDescription className="text-gray-400">
                  当前可用余额
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-4">
                  <Wallet className="h-8 w-8 text-accent mr-3" />
                  <span className="text-3xl font-bold text-white">{userData?.balance || 0}</span>
                  <span className="text-gray-400 ml-2">USDT</span>
                </div>
                <p className="text-gray-400 text-sm">
                  每次与AI对话消耗0.1 USDT，请保持充足余额
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                  onClick={() => document.getElementById("recharge-modal")?.classList.remove("hidden")}
                >
                  充值
                </Button>
              </CardFooter>
            </Card>
            
            {/* 使用统计卡片 */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>使用统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">集成项目数</span>
                  <span className="text-white">{projects?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">AI对话次数</span>
                  <span className="text-white">
                    {transactions?.filter(t => t.type === "consumption").length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">已消费</span>
                  <span className="text-white">
                    {Math.abs(transactions?.filter(t => t.type === "consumption")
                      .reduce((sum, t) => sum + t.amount, 0) || 0).toFixed(2)} USDT
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 hover:border-accent hover:bg-accent/10"
                  onClick={() => navigate("/my-projects")}
                >
                  查看我的项目
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList>
              <TabsTrigger value="transactions">交易记录</TabsTrigger>
              <TabsTrigger value="projects">最近项目</TabsTrigger>
            </TabsList>
            
            {/* 交易记录标签内容 */}
            <TabsContent value="transactions">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>交易记录</CardTitle>
                  <CardDescription className="text-gray-400">
                    您的账户充值和消费记录
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isTransactionsLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  ) : transactions?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-gray-800 border-gray-700">
                          <TableHead>时间</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>描述</TableHead>
                          <TableHead className="text-right">金额</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions?.map((transaction) => (
                          <TableRow key={transaction.id} className="hover:bg-gray-800 border-gray-700">
                            <TableCell className="text-gray-400">
                              {formatDate(transaction.createdAt)}
                            </TableCell>
                            <TableCell>
                              {transaction.type === "recharge" ? (
                                <span className="flex items-center text-green-400">
                                  <ArrowUpRight className="mr-1 h-4 w-4" />
                                  充值
                                </span>
                              ) : (
                                <span className="flex items-center text-red-400">
                                  <ArrowDownRight className="mr-1 h-4 w-4" />
                                  消费
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className={`text-right ${transaction.type === "recharge" ? "text-green-400" : "text-red-400"}`}>
                              {transaction.type === "recharge" ? "+" : "-"}
                              {Math.abs(transaction.amount).toFixed(2)} USDT
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      <p>暂无交易记录</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* 最近项目标签内容 */}
            <TabsContent value="projects">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>最近项目</CardTitle>
                    <CardDescription className="text-gray-400">
                      您最近创建的集成项目
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => navigate("/new-integration")}
                    className="bg-accent hover:bg-accent/90 text-white"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    新建项目
                  </Button>
                </CardHeader>
                <CardContent>
                  {isProjectsLoading ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  ) : projects?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-gray-800 border-gray-700">
                          <TableHead>项目名称</TableHead>
                          <TableHead>创建时间</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects?.slice(0, 5).map((project) => (
                          <TableRow key={project.id} className="hover:bg-gray-800 border-gray-700">
                            <TableCell className="font-medium">{project.name}</TableCell>
                            <TableCell className="text-gray-400">
                              {formatDate(project.createdAt)}
                            </TableCell>
                            <TableCell>
                              {project.status === "completed" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-400/10 text-green-400">
                                  已完成
                                </span>
                              ) : project.status === "in_progress" ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400">
                                  进行中
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-400/10 text-gray-400">
                                  草稿
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-accent hover:text-accent/80 hover:bg-accent/10"
                                onClick={() => navigate(`/projects/${project.id}`)}
                              >
                                查看
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-gray-400">
                      <p>暂无项目记录</p>
                      <Button
                        onClick={() => navigate("/new-integration")}
                        variant="outline"
                        className="mt-4 border-accent text-accent hover:bg-accent/10"
                      >
                        创建第一个项目
                      </Button>
                    </div>
                  )}
                </CardContent>
                {projects && projects.length > 5 && (
                  <CardFooter className="justify-center">
                    <Button
                      variant="ghost"
                      className="text-accent hover:text-accent/80"
                      onClick={() => navigate("/my-projects")}
                    >
                      查看全部项目
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* 充值模态框 */}
      <div
        id="recharge-modal"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 hidden"
      >
        <Card className="bg-gray-900 border-gray-700 w-full max-w-md">
          <CardHeader>
            <CardTitle>USDT充值</CardTitle>
            <CardDescription className="text-gray-400">
              请输入您想充值的金额
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">充值金额</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="10"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(Number(e.target.value))}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">当前余额</span>
                <span className="text-white">{userData?.balance || 0} USDT</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-400">充值后余额</span>
                <span className="text-accent">{(userData?.balance || 0) + rechargeAmount} USDT</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              className="border-gray-700"
              onClick={() => document.getElementById("recharge-modal")?.classList.add("hidden")}
            >
              取消
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={handleRecharge}
              disabled={rechargeMutation.isPending}
            >
              {rechargeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  确认充值
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}