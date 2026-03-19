import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Search,
  Plus,
  Eye,
  Code,
  Filter,
  ArrowUpDown
} from "lucide-react";

export default function MyProjects() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 用户集成项目查询
  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ["/api/integration-projects"],
    enabled: !!user,
  });

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

  // 筛选和排序项目
  const filteredProjects = projects
    ? projects
        .filter(project => 
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .filter(project => 
          statusFilter === "all" || project.status === statusFilter
        )
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        })
    : [];

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col">
      <Header />
      
      {/* 顶部彩带 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">我的集成项目</h1>
            <Button
              onClick={() => navigate("/new-integration")}
              className="gradient-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </Button>
          </div>
          
          <Card className="bg-gray-900 border-gray-700 mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="搜索项目..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-gray-800 border-gray-700"
                  />
                </div>
                
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                    >
                      <option value="all">所有状态</option>
                      <option value="draft">草稿</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="failed">失败</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-700"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>项目列表</CardTitle>
              <CardDescription className="text-gray-400">
                管理您的所有支付API集成项目
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : filteredProjects.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-800 border-gray-700">
                      <TableHead>项目名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id} className="hover:bg-gray-800 border-gray-700">
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell className="text-gray-400 max-w-xs truncate">
                          {project.description || "无描述"}
                        </TableCell>
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
                          ) : project.status === "failed" ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-400/10 text-red-400">
                              失败
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-400/10 text-gray-400">
                              草稿
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-white hover:bg-gray-800"
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-accent hover:text-accent/80 hover:bg-accent/10"
                              onClick={() => navigate(`/projects/${project.id}/code`)}
                            >
                              <Code className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-400 mb-4">没有找到符合条件的项目</p>
                  {projects?.length === 0 ? (
                    <Button
                      onClick={() => navigate("/new-integration")}
                      className="gradient-btn"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      创建第一个项目
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-gray-700"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                    >
                      清除筛选条件
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {filteredProjects.length > 0 && (
              <CardFooter className="border-t border-gray-700 py-4 px-6">
                <div className="text-gray-400 text-sm">
                  {`显示 ${filteredProjects.length} 个项目 (共 ${projects?.length || 0} 个)`}
                </div>
              </CardFooter>
            )}
          </Card>
          
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">支付API集成指南</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    1
                  </div>
                  <h3 className="font-medium">收集API文档</h3>
                </div>
                <p className="text-gray-400 text-sm pl-10">
                  确保您有完整的API文档，包括端点、参数和认证方式
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    2
                  </div>
                  <h3 className="font-medium">与AI对话</h3>
                </div>
                <p className="text-gray-400 text-sm pl-10">
                  向AI描述您的集成需求，AI会分析文档并生成代码
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                    3
                  </div>
                  <h3 className="font-medium">测试与优化</h3>
                </div>
                <p className="text-gray-400 text-sm pl-10">
                  使用生成的代码进行集成测试，与AI沟通优化代码
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}