import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Sparkles, Edit, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import {
  getAllServices,
  createService,
  updateService,
  deleteService
} from '../services/serviceService';
import { useToast } from '@/hooks/use-toast';

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: 60,
    order: 0,
    imageUrl: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getAllServices();
      setServices(data);
    } catch (error) {
      toast({
        title: '載入失敗',
        description: '無法載入療程列表，請稍後再試',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name || '',
        description: service.description || '',
        price: service.price || '',
        duration: service.duration || 60,
        order: service.order || 0,
        imageUrl: service.imageUrl || ''
      });
      setImagePreview(service.imageUrl || null);
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: 60,
        order: services.length,
        imageUrl: ''
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedService(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast({
        title: '欄位缺失',
        description: '請填寫療程名稱和價格',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (selectedService) {
        await updateService(selectedService.id, formData, imageFile);
        toast({
          title: '更新成功',
          description: '療程已更新'
        });
      } else {
        await createService(formData, imageFile);
        toast({
          title: '新增成功',
          description: '療程已成功新增'
        });
      }
      handleCloseDialog();
      loadServices();
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
      await deleteService(selectedService.id);
      toast({
        title: '刪除成功',
        description: '療程已被刪除'
      });
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
      loadServices();
    } catch (error) {
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleOpenDeleteDialog = (service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>療程管理</CardTitle>
              <CardDescription>管理療程項目與價格</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Sparkles className="w-4 h-4 mr-2" />
              新增療程
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">尚無療程資料</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {service.imageUrl ? (
                    <div className="h-48 bg-accent flex items-center justify-center overflow-hidden">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-accent flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {service.description || '無描述'}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-primary">
                        ${service.price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {service.duration} 分鐘
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenDialog(service)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        編輯
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDeleteDialog(service)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedService ? '編輯療程' : '新增療程'}</DialogTitle>
            <DialogDescription>
              {selectedService ? '更新療程資料' : '新增一個新療程'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">療程名稱 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">價格 *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">時長（分鐘）</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">排序順序</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">療程圖片</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => document.getElementById('image').click()}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                {imagePreview && (
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button type="submit">
                {selectedService ? '更新' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此療程嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。療程資料和相關圖片將被永久刪除。
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
