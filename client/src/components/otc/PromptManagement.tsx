import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PromptItem = {
  id?: string | number;
  key: string;
  text: string;
  desc: string;
};

type GetPromptResponse = {
  code: number;
  msg?: string;
  data?: PromptItem[] | { list?: PromptItem[] };
};

export function PromptManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PromptItem | null>(null);
  const [editText, setEditText] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const rows = useMemo(() => prompts, [prompts]);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<GetPromptResponse>("POST", "/Api/Index/getPrompt", {});
      const data = (res as any)?.data;
      const list: PromptItem[] =
        Array.isArray(data) ? data :
        Array.isArray(data?.list) ? data.list :
        [];
      setPrompts(list);
    } catch (e: any) {
      toast({
        title: "加载失败",
        description: e?.message || "请求失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (item: PromptItem) => {
    setEditing(item);
    setEditText(item.text ?? "");
    setEditDesc(item.desc ?? "");
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      // 接口文档只列了 text/desc，但实际更新通常需要 key 定位。
      // 这里附带 id/key（不可编辑），后端若忽略也不会影响。
      const res = await apiRequest<any>("POST", "/Api/Index/setPrompt", {
        id: editing.id,
        key: editing.key,
        text: editText,
        desc: editDesc,
      });
      if ((res as any)?.code === 0 || (res as any)?.code === undefined) {
        toast({ title: "保存成功" });
        setEditOpen(false);
        await load();
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
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6">
        <div className="flex items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">AI任务提示词配置</h2>
            <p className="text-sm text-gray-500 mt-1">可查看列表并编辑提示词内容与备注（key 仅展示不可修改）。</p>
          </div>
          <Button
            variant="outline"
            className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
            onClick={load}
            disabled={isLoading}
            title="刷新"
          >
            <RefreshCw className={isLoading ? "h-4 w-4 mr-2 animate-spin" : "h-4 w-4 mr-2"} />
            刷新
          </Button>
        </div>

        {/* 手机端：卡片布局（对齐其他管理页风格） */}
        <div className="md:hidden space-y-4">
          {rows.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              {isLoading ? "加载中..." : "暂无数据"}
            </div>
          ) : (
            rows.map((item) => (
              <Card key={item.key} className="p-4 bg-white border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">key</div>
                    <div className="font-mono text-gray-900 break-all">{item.key}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex-shrink-0"
                    onClick={() => openEdit(item)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    编辑
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">提示词</div>
                    <div className="text-gray-700 whitespace-pre-wrap break-words">
                      {item.text || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">备注</div>
                    <div className="text-gray-700 whitespace-pre-wrap break-words">
                      {item.desc || "-"}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 桌面端：表格布局 */}
        <div className="hidden md:block border border-gray-200 rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700 whitespace-nowrap">key</TableHead>
                <TableHead className="text-gray-700">提示词</TableHead>
                <TableHead className="text-gray-700">备注</TableHead>
                <TableHead className="text-gray-700 w-[120px] whitespace-nowrap">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-10">
                    {isLoading ? "加载中..." : "暂无数据"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item) => (
                  <TableRow key={item.key} className="bg-white hover:bg-gray-50 transition-colors">
                    <TableCell className="text-gray-900 font-mono whitespace-nowrap">{item.key}</TableCell>
                    <TableCell className="text-gray-700">
                      <div className={cn("max-w-[520px] whitespace-pre-wrap break-words line-clamp-3")}>
                        {item.text || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <div className={cn("max-w-[360px] whitespace-pre-wrap break-words line-clamp-3")}>
                        {item.desc || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => openEdit(item)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        编辑
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-gray-900">编辑提示词</DialogTitle>
            <DialogDescription className="text-gray-600">
              key 仅用于查看与定位，不允许修改。
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-2 -mr-2">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prompt_key" className="text-gray-700">key</Label>
                <Input
                  id="prompt_key"
                  value={editing?.key || ""}
                  disabled
                  className="bg-gray-50 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt_text" className="text-gray-700">提示词</Label>
                <Textarea
                  id="prompt_text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="bg-white text-gray-900"
                  rows={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt_desc" className="text-gray-700">备注</Label>
                <Textarea
                  id="prompt_desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="bg-white text-gray-900"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4">
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={() => setEditOpen(false)}
              disabled={isSaving}
            >
              取消
            </Button>
            <Button
              variant="outline"
              className="bg-white border-gray-300 text-gray-900"
              onClick={submitEdit}
              disabled={isSaving}
            >
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

