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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Calendar,
  Phone,
  Edit,
  Trash2,
  Plus,
  UserPlus,
  ClipboardCheck,
  Search,
  Crown,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import {
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking
} from '../services/bookingService';
import { getAllServices } from '../services/serviceService';
import {
  getAllCustomers,
  checkCustomerExistsByPhone,
  createOrUpdateCustomerFromBooking
} from '../services/customerService';
import { createVisitFromBooking } from '../services/visitService';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [addonServices, setAddonServices] = useState([]); // 加購課程列表
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // 表單資料
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    customerId: '',
    membershipLevel: 'regular',
    bookingDate: '',
    bookingTime: '',
    serviceId: '',
    serviceName: '',
    price: 0,
    originalPrice: 0,
    useSelfOil: false,
    selfOilPrice: 0,
    extraOilFee: 0, // VIP客戶忘記帶精油的額外費用
    additionalServiceId: '', // 加購課程ID
    additionalService: '',
    additionalServicePrice: 0,
    totalPrice: 0,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: '', // 付款方式：cash, deposit
    notes: ''
  });

  // 新增客戶表單
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'female',
    notes: ''
  });

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
      // 篩選主要療程（非加購項目）和加購課程
      setServices(servicesData.filter(s => s.category !== 'minispa'));
      setAddonServices(servicesData.filter(s => s.category === 'minispa'));
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

  // 處理客戶選擇
  const handleCustomerSelect = async (phone) => {
    const customer = customers.find(c => c.phone === phone);
    if (customer) {
      // 先更新客戶資訊
      setFormData(prev => {
        const newData = {
          ...prev,
          customerId: customer.id,
          customerName: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          membershipLevel: customer.membershipLevel || 'regular'
        };
        return newData;
      });

      // 延遲重新計算價格，確保狀態已更新
      setTimeout(() => {
        if (formData.serviceId) {
          calculatePrice(formData.serviceId, customer.membershipLevel, formData.useSelfOil, formData.extraOilFee);
        }
      }, 0);
    }
  };

  // 計算價格
  const calculatePrice = (serviceId, membershipLevel, useSelfOil, extraOilFee = 0) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    let finalPrice = service.price;
    const originalPrice = service.price;

    // VIP 享 5 折 + 額外精油費用
    if (membershipLevel === 'vip') {
      finalPrice = Math.round(service.price * 0.5) + (extraOilFee || 0);
    }
    // 一般會員自備精油享優惠價
    else if (useSelfOil && service.selfOilPrice) {
      finalPrice = service.selfOilPrice;
    }

    setFormData(prev => ({
      ...prev,
      serviceId: service.id,
      serviceName: service.name,
      originalPrice: originalPrice,
      price: finalPrice,
      selfOilPrice: service.selfOilPrice || 0,
      totalPrice: finalPrice + (prev.additionalServicePrice || 0)
    }));
  };

  // 處理療程選擇
  const handleServiceChange = (serviceId) => {
    calculatePrice(serviceId, formData.membershipLevel, formData.useSelfOil, formData.extraOilFee);
  };

  // 處理自備精油變更
  const handleSelfOilChange = (checked) => {
    const useSelfOil = checked;
    setFormData(prev => ({
      ...prev,
      useSelfOil
    }));
    if (formData.serviceId) {
      calculatePrice(formData.serviceId, formData.membershipLevel, useSelfOil, formData.extraOilFee);
    }
  };

  // 處理精油費用增減（VIP客戶）
  const handleExtraOilFeeChange = (change) => {
    const newFee = Math.max(0, (formData.extraOilFee || 0) + change);
    setFormData(prev => ({
      ...prev,
      extraOilFee: newFee
    }));
    if (formData.serviceId) {
      calculatePrice(formData.serviceId, formData.membershipLevel, formData.useSelfOil, newFee);
    }
  };

  // 處理加購課程選擇
  const handleAdditionalServiceChange = (serviceId) => {
    if (!serviceId || serviceId === 'none') {
      // 清除加購課程
      setFormData(prev => ({
        ...prev,
        additionalServiceId: '',
        additionalService: '',
        additionalServicePrice: 0,
        totalPrice: prev.price
      }));
      return;
    }

    const addonService = addonServices.find(s => s.id === serviceId);
    if (addonService) {
      const addonPrice = addonService.price || 0;
      setFormData(prev => ({
        ...prev,
        additionalServiceId: addonService.id,
        additionalService: addonService.name,
        additionalServicePrice: addonPrice,
        totalPrice: prev.price + addonPrice
      }));
    }
  };

  // 開啟新增/編輯對話框
  const handleOpenDialog = (booking = null) => {
    if (booking) {
      setIsEditing(true);
      setSelectedBooking(booking);
      setFormData({
        customerName: booking.customerName || '',
        phone: booking.phone || '',
        email: booking.email || '',
        customerId: booking.customerId || '',
        membershipLevel: booking.membershipLevel || 'regular',
        bookingDate: booking.bookingDate?.toDate ?
          booking.bookingDate.toDate().toISOString().split('T')[0] : '',
        bookingTime: booking.bookingTime || '',
        serviceId: booking.serviceId || '',
        serviceName: booking.serviceName || '',
        price: booking.price || 0,
        originalPrice: booking.originalPrice || 0,
        useSelfOil: booking.useSelfOil || false,
        selfOilPrice: booking.selfOilPrice || 0,
        extraOilFee: booking.extraOilFee || 0,
        additionalServiceId: booking.additionalServiceId || '',
        additionalService: booking.additionalService || '',
        additionalServicePrice: booking.additionalServicePrice || 0,
        totalPrice: booking.totalPrice || booking.price || 0,
        status: booking.status || 'pending',
        paymentStatus: booking.paymentStatus || 'unpaid',
        paymentMethod: booking.paymentMethod || '',
        notes: booking.notes || ''
      });
    } else {
      setIsEditing(false);
      setSelectedBooking(null);
      setFormData({
        customerName: '',
        phone: '',
        email: '',
        customerId: '',
        membershipLevel: 'regular',
        bookingDate: '',
        bookingTime: '',
        serviceId: '',
        serviceName: '',
        price: 0,
        originalPrice: 0,
        useSelfOil: false,
        selfOilPrice: 0,
        extraOilFee: 0,
        additionalServiceId: '',
        additionalService: '',
        additionalServicePrice: 0,
        totalPrice: 0,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: '',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setSelectedBooking(null);
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.phone || !formData.bookingDate || !formData.serviceId) {
      toast({
        title: '欄位缺失',
        description: '請填寫必填欄位',
        variant: 'destructive'
      });
      return;
    }

    try {
      const bookingData = {
        ...formData,
        bookingDate: Timestamp.fromDate(new Date(formData.bookingDate + 'T00:00:00')),
        updatedAt: Timestamp.now()
      };

      if (isEditing) {
        await updateBooking(selectedBooking.id, bookingData);
        toast({
          title: '更新成功',
          description: '預約已更新'
        });
      } else {
        await createBooking(bookingData);
        toast({
          title: '新增成功',
          description: '預約已成功新增'
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

  // 確認付款
  const handleConfirmPayment = async () => {
    if (!selectedBooking) return;

    // 檢查是否已選擇付款方式
    if (!formData.paymentMethod) {
      toast({
        title: '請選擇付款方式',
        description: '請先選擇現金或儲值扣款',
        variant: 'destructive'
      });
      return;
    }

    try {
      await updateBooking(selectedBooking.id, {
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: formData.paymentMethod
      });
      toast({
        title: '付款確認',
        description: `預約已標記為已付款（${formData.paymentMethod === 'cash' ? '現金' : '儲值扣款'}）`
      });
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

  // 刪除預約
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

  // 新增客戶
  const handleCreateCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      toast({
        title: '欄位缺失',
        description: '請填寫姓名和電話',
        variant: 'destructive'
      });
      return;
    }

    try {
      // 檢查電話是否已存在
      const exists = await checkCustomerExistsByPhone(newCustomerData.phone);
      if (exists) {
        toast({
          title: '客戶已存在',
          description: '此電話號碼已被使用',
          variant: 'destructive'
        });
        return;
      }

      const result = await createOrUpdateCustomerFromBooking({
        customerName: newCustomerData.name,
        phone: newCustomerData.phone,
        email: newCustomerData.email,
        gender: newCustomerData.gender,
        notes: newCustomerData.notes
      });

      toast({
        title: '新增成功',
        description: '客戶已成功新增'
      });

      // 重新載入客戶列表
      const customersData = await getAllCustomers();
      setCustomers(customersData);

      // 自動填入表單
      const newCustomer = customersData.find(c => c.id === result.customerId);
      if (newCustomer) {
        setFormData(prev => ({
          ...prev,
          customerId: newCustomer.id,
          customerName: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email || '',
          membershipLevel: newCustomer.membershipLevel || 'regular'
        }));
      }

      setIsCustomerDialogOpen(false);
      setNewCustomerData({
        name: '',
        phone: '',
        email: '',
        gender: 'female',
        notes: ''
      });
    } catch (error) {
      toast({
        title: '新增失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 建立來店記錄
  const handleCreateVisit = async (booking) => {
    if (booking.paymentStatus !== 'paid') {
      toast({
        title: '無法建立來店記錄',
        description: '只有已付款的預約才能建立來店記錄',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createVisitFromBooking(booking.id);
      toast({
        title: '建立成功',
        description: '來店記錄已成功建立'
      });
      loadData();
    } catch (error) {
      toast({
        title: '建立失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // 過濾預約
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 狀態樣式（整合狀態和付款狀態）
  const getStatusBadge = (booking) => {
    // 優先顯示付款狀態
    if (booking.paymentStatus === 'paid') {
      return <Badge variant="default" className="bg-green-600">已付款</Badge>;
    }

    // 顯示預約狀態
    const statusConfig = {
      pending: { label: '未確認', variant: 'secondary' },
      confirmed: { label: '已確認', variant: 'default' },
      completed: { label: '已完成', variant: 'outline' }
    };
    const config = statusConfig[booking.status] || { label: booking.status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>預約管理</CardTitle>
              <CardDescription>管理客戶預約記錄</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              新增預約
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜尋和篩選 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋客戶姓名或電話..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">未確認</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 預約列表 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">尚無預約資料</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客戶名稱</TableHead>
                    <TableHead>電話</TableHead>
                    <TableHead>會員等級</TableHead>
                    <TableHead>預約項目</TableHead>
                    <TableHead>自備精油</TableHead>
                    <TableHead>價格</TableHead>
                    <TableHead>加購課程</TableHead>
                    <TableHead>加購價格</TableHead>
                    <TableHead className="font-bold">總價</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.customerName}</TableCell>
                      <TableCell>{booking.phone}</TableCell>
                      <TableCell>
                        {booking.membershipLevel === 'vip' ? (
                          <Badge variant="default" className="bg-amber-600">
                            <Crown className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        ) : (
                          <Badge variant="secondary">一般</Badge>
                        )}
                      </TableCell>
                      <TableCell>{booking.serviceName || '-'}</TableCell>
                      <TableCell className="text-center">
                        {booking.useSelfOil ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>NT$ {booking.price || 0}</TableCell>
                      <TableCell>
                        {booking.additionalService || '-'}
                      </TableCell>
                      <TableCell>
                        {booking.additionalServicePrice ? `NT$ ${booking.additionalServicePrice}` : '-'}
                      </TableCell>
                      <TableCell className="font-bold text-lg">
                        NT$ {booking.totalPrice || booking.price || 0}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateVisit(booking)}
                            disabled={booking.paymentStatus !== 'paid'}
                            title="新增來店記錄（需已付款）"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(booking)}
                            disabled={booking.paymentStatus === 'paid'}
                            title={booking.paymentStatus === 'paid' ? '已付款預約無法編輯' : '編輯預約'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={booking.paymentStatus === 'paid'}
                            title={booking.paymentStatus === 'paid' ? '已付款預約無法刪除' : '刪除預約'}
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

      {/* 新增/編輯預約對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? '編輯預約' : '新增預約'}</DialogTitle>
            <DialogDescription>
              {isEditing ? '更新預約資料' : '建立新的預約記錄'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* 客戶資訊 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>客戶資訊</Label>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewCustomerData({
                          name: '',
                          phone: '',
                          email: '',
                          gender: 'female',
                          notes: ''
                        });
                        setIsCustomerDialogOpen(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      新增客戶
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">客戶電話 *</Label>
                    <Select
                      value={formData.phone}
                      onValueChange={handleCustomerSelect}
                      disabled={isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇客戶電話" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.phone}>
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">客戶姓名 *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membershipLevel">會員等級</Label>
                  <Input
                    id="membershipLevel"
                    value={formData.membershipLevel === 'vip' ? 'VIP會員' : '一般會員'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* 預約資訊 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bookingDate">預約日期 *</Label>
                  <Input
                    id="bookingDate"
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                    required
                  />
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
              </div>

              {/* 療程選擇 */}
              <div className="space-y-2">
                <Label htmlFor="serviceId">療程項目 *</Label>
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
                        {service.name} - NT$ {service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 自備精油（僅一般會員） */}
              {formData.membershipLevel === 'regular' && formData.serviceId && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useSelfOil"
                      checked={formData.useSelfOil}
                      onChange={(e) => handleSelfOilChange(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="useSelfOil" className="cursor-pointer">
                      自備多特瑞精油（優惠價 NT$ {formData.selfOilPrice}）
                    </Label>
                  </div>
                </div>
              )}

              {/* 精油費用（僅VIP會員） */}
              {formData.membershipLevel === 'vip' && formData.serviceId && (
                <div className="space-y-2 col-span-2">
                  <Label>忘記帶精油額外費用（VIP專用）</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtraOilFeeChange(-100)}
                      disabled={formData.extraOilFee === 0}
                    >
                      - NT$ 100
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        NT$ {formData.extraOilFee}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formData.extraOilFee > 0 ? '已加收精油費用' : '無需額外費用'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtraOilFeeChange(100)}
                    >
                      + NT$ 100
                    </Button>
                  </div>
                </div>
              )}

              {/* 價格顯示 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>原價</Label>
                  <Input
                    value={`NT$ ${formData.originalPrice}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>優惠價格</Label>
                  <Input
                    value={`NT$ ${formData.price}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>總價</Label>
                  <Input
                    value={`NT$ ${formData.totalPrice}`}
                    readOnly
                    className="bg-muted font-bold"
                  />
                </div>
              </div>

              {/* 加購課程 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="additionalServiceId">加購課程</Label>
                  <Select
                    value={formData.additionalServiceId || 'none'}
                    onValueChange={handleAdditionalServiceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇加購課程（可選）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">無加購</SelectItem>
                      {addonServices.map((addon) => (
                        <SelectItem key={addon.id} value={addon.id}>
                          {addon.name} - NT$ {addon.price} ({addon.duration}分鐘)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalServicePrice">加購價格</Label>
                  <Input
                    id="additionalServicePrice"
                    type="number"
                    value={formData.additionalServicePrice}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* 預約狀態和付款方式 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">預約狀態</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">未確認</SelectItem>
                      <SelectItem value="confirmed">已確認</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">付款方式</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇付款方式" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">現金</SelectItem>
                        <SelectItem value="deposit">儲值扣款</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* 備註 */}
              <div className="space-y-2">
                <Label htmlFor="notes">備註</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="default"
                  onClick={handleConfirmPayment}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  確認付款
                </Button>
              )}
              <Button type="submit">
                {isEditing ? '更新' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 新增客戶對話框 */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增客戶</DialogTitle>
            <DialogDescription>建立新的客戶資料</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newName">姓名 *</Label>
              <Input
                id="newName"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPhone">電話 *</Label>
              <Input
                id="newPhone"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newEmail">Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newGender">性別</Label>
              <Select
                value={newCustomerData.gender}
                onValueChange={(value) => setNewCustomerData({ ...newCustomerData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">女</SelectItem>
                  <SelectItem value="male">男</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newNotes">備註</Label>
              <Textarea
                id="newNotes"
                value={newCustomerData.notes}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCustomerDialogOpen(false)}
            >
              取消
            </Button>
            <Button type="button" onClick={handleCreateCustomer}>
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此預約嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。預約資料將被永久刪除。
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
