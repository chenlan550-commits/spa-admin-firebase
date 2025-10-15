import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, Edit, Trash2, Clock, User } from 'lucide-react';
import {
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingsByDateRange
} from '../services/bookingService';
import { getAllCustomers } from '../services/customerService';
import { getAllServices } from '../services/serviceService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const statusOptions = [
  { value: 'pending', label: '待確認', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: '已確認', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: '已取消', color: 'bg-red-100 text-red-800' },
];

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    serviceId: '',
    serviceName: '',
    bookingDate: new Date(),
    bookingTime: '',
    duration: 60,
    status: 'pending',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, customersData, servicesData] = await Promise.all([
        getAllBookings(),
        getAllCustomers(),
        getAllServices()
      ]);
      setBookings(bookingsData);
      setCustomers(customersData);
      setServices(servicesData);
    } catch (error) {
      toast({
        title: '載入失敗',
        description: '無法載入資料，請稍後再試',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (booking = null) => {
    if (booking) {
      setSelectedBooking(booking);
      setFormData({
        customerId: booking.customerId || '',
        customerName: booking.customerName || '',
        serviceId: booking.serviceId || '',
        serviceName: booking.serviceName || '',
        bookingDate: booking.bookingDate?.toDate() || new Date(),
        bookingTime: booking.bookingTime || '',
        duration: booking.duration || 60,
        status: booking.status || 'pending',
        notes: booking.notes || ''
      });
    } else {
      setSelectedBooking(null);
      setFormData({
        customerId: '',
        customerName: '',
        serviceId: '',
        serviceName: '',
        bookingDate: new Date(),
        bookingTime: '',
        duration: 60,
        status: 'pending',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customerId,
      customerName: customer?.name || ''
    });
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    setFormData({
      ...formData,
      serviceId,
      serviceName: service?.name || '',
      duration: service?.duration || 60
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerId || !formData.serviceId || !formData.bookingTime) {
      toast({
        title: '欄位缺失',
        description: '請填寫所有必填欄位',
        variant: 'destructive'
      });
      return;
    }

    try {
      const bookingData = {
        ...formData,
        bookingDate: formData.bookingDate
      };

      if (selectedBooking) {
        await updateBooking(selectedBooking.id, bookingData);
        toast({
          title: '更新成功',
          description: '預約已更新'
        });
      } else {
        await createBooking(bookingData);
        toast({
          title: '新增成功',
          description: '預約已成功建立'
        });
      }
      handleCloseDialog();
      loadData();
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
      await deleteBooking(selectedBooking.id);
      toast({
        title: '刪除成功',
        description: '預約已被刪除'
      });
      setIsDeleteDialogOpen(false);
      setSelectedBooking(null);
      loadData();
    } catch (error) {
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleOpenDeleteDialog = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge className={statusOption?.color || ''}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    if (!booking.bookingDate) return false;
    const bookingDate = booking.bookingDate.toDate();
    return format(bookingDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 日曆選擇器 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>選擇日期</CardTitle>
            <CardDescription>點擊日期查看預約</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={zhTW}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* 預約列表 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedDate && format(selectedDate, 'yyyy年MM月dd日', { locale: zhTW })} 的預約
                </CardTitle>
                <CardDescription>共 {filteredBookings.length} 筆預約</CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <CalendarPlus className="w-4 h-4 mr-2" />
                新增預約
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">載入中...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                此日期無預約
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings
                  .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime))
                  .map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{booking.bookingTime}</span>
                            <span className="text-sm text-muted-foreground">
                              ({booking.duration} 分鐘)
                            </span>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{booking.customerName}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            療程: {booking.serviceName}
                          </div>
                          {booking.notes && (
                            <div className="text-sm text-muted-foreground">
                              備註: {booking.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(booking)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(booking)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 所有預約列表 */}
      <Card>
        <CardHeader>
          <CardTitle>所有預約</CardTitle>
          <CardDescription>查看和管理所有預約記錄</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">尚無預約記錄</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>時間</TableHead>
                    <TableHead>客戶</TableHead>
                    <TableHead>療程</TableHead>
                    <TableHead>時長</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        {booking.bookingDate &&
                          format(booking.bookingDate.toDate(), 'yyyy/MM/dd')}
                      </TableCell>
                      <TableCell>{booking.bookingTime}</TableCell>
                      <TableCell className="font-medium">{booking.customerName}</TableCell>
                      <TableCell>{booking.serviceName}</TableCell>
                      <TableCell>{booking.duration} 分鐘</TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(booking)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(booking)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedBooking ? '編輯預約' : '新增預約'}</DialogTitle>
            <DialogDescription>
              {selectedBooking ? '更新預約資料' : '建立新的預約'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer">客戶 *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={handleCustomerChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇客戶" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">療程 *</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={handleServiceChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇療程" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - ${service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingTime">預約時間 *</Label>
                <Input
                  id="bookingTime"
                  type="time"
                  value={formData.bookingTime}
                  onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
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

              <div className="space-y-2">
                <Label htmlFor="status">狀態</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button type="submit">
                {selectedBooking ? '更新' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此預約嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。預約記錄將被永久刪除。
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
