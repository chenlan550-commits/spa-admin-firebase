import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilePlus, Edit, Trash2, FileText } from 'lucide-react';
import {
  getAllContent,
  createContent,
  updateContent,
  deleteContent
} from '../services/contentService';
import { useToast } from '@/hooks/use-toast';

const contentTypes = [
  { value: 'about', label: '關於我們' },
  { value: 'features', label: '特色服務' },
  { value: 'testimonials', label: '客戶評價' },
  { value: 'faq', label: '常見問題' },
  { value: 'policy', label: '服務條款' },
  { value: 'announcement', label: '最新公告' },
];

export default function ContentManagement() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [formData, setFormData] = useState({
    type: 'about',
    title: '',
    content: '',
    isPublished: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      const data = await getAllContent();
      setContents(data);
    } catch (error) {
      toast({
        title: '載入失敗',
        description: '無法載入內容列表，請稍後再試',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (content = null) => {
    if (content) {
      setSelectedContent(content);
      setFormData({
        type: content.type || 'about',
        title: content.title || '',
        content: content.content || '',
        isPublished: content.isPublished !== undefined ? content.isPublished : true
      });
    } else {
      setSelectedContent(null);
      setFormData({
        type: 'about',
        title: '',
        content: '',
        isPublished: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedContent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast({
        title: '欄位缺失',
        description: '請填寫標題和內容',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (selectedContent) {
        await updateContent(selectedContent.id, formData);
        toast({
          title: '更新成功',
          description: '內容已更新'
        });
      } else {
        await createContent(formData);
        toast({
          title: '新增成功',
          description: '內容已成功新增'
        });
      }
      handleCloseDialog();
      loadContents();
    } catch (error) {
      toast({
        title: '操作失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContent(selectedContent.id);
      toast({
        title: '刪除成功',
        description: '內容已被刪除'
      });
      setIsDeleteDialogOpen(false);
      setSelectedContent(null);
      loadContents();
    } catch (error) {
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleOpenDeleteDialog = (content) => {
    setSelectedContent(content);
    setIsDeleteDialogOpen(true);
  };

  const getTypeLabel = (type) => {
    return contentTypes.find(t => t.value === type)?.label || type;
  };

  const groupedContents = contentTypes.map(type => ({
    ...type,
    items: contents.filter(c => c.type === type.value)
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>內容管理</CardTitle>
              <CardDescription>更新網站內容與資訊</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <FilePlus className="w-4 h-4 mr-2" />
              新增內容
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : contents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">尚無內容資料</div>
          ) : (
            <div className="space-y-6">
              {groupedContents.map((group) => (
                group.items.length > 0 && (
                  <div key={group.value}>
                    <h3 className="text-lg font-semibold mb-3 text-secondary">
                      {group.label}
                    </h3>
                    <div className="space-y-3">
                      {group.items.map((content) => (
                        <Card key={content.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-muted-foreground" />
                                  <h4 className="font-medium">{content.title}</h4>
                                  {content.isPublished ? (
                                    <Badge className="bg-green-100 text-green-800">已發布</Badge>
                                  ) : (
                                    <Badge className="bg-gray-100 text-gray-800">草稿</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {content.content}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDialog(content)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDeleteDialog(content)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContent ? '編輯內容' : '新增內容'}</DialogTitle>
            <DialogDescription>
              {selectedContent ? '更新網站內容' : '新增新的網站內容'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">內容類型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">標題 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">內容 *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="isPublished" className="cursor-pointer">
                  立即發布
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button type="submit">
                {selectedContent ? '更新' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此內容嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。內容將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
