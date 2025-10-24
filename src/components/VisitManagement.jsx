// 來店記錄管理組件 - 完整版
import React, { useState, useEffect } from 'react';
import {
  getAllVisits,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitStats,
  getVisitsByCustomerId,
  getCustomerVisitStats
} from '../services/visitService';
import { getAllCustomers } from '../services/customerService';
import { getAllServices } from '../services/serviceService';
import { Timestamp } from 'firebase/firestore';
import {
  Calendar,
  Clock,
  User,
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  CreditCard,
  Wallet,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const VisitManagement = () => {
  // State Management
  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisMonth: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    thisMonthRevenue: 0,
    paymentMethods: { cash: 0, card: 0, deposit: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    serviceId: '',
    serviceName: '',
    visitDate: '',
    duration: 60,
    originalPrice: 0,
    price: 0,
    isVIP: false,
    useSelfOil: false,
    extraOilFee: 0,
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    notes: ''
  });

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [visitsData, customersData, servicesData, statsData] = await Promise.all([
        getAllVisits(),
        getAllCustomers(),
        getAllServices(),
        getVisitStats()
      ]);
      setVisits(visitsData);
      setCustomers(customersData);
      setServices(servicesData);
      setStats(statsData);
    } catch (error) {
      console.error('載入資料失敗:', error);
      toast({
        title: '載入失敗',
        description: '無法載入來店記錄，請重新整理頁面',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Create/Edit
  const handleOpenDialog = (visit = null) => {
    if (visit) {
      setIsEditing(true);
      setCurrentVisit(visit);

      const visitDate = visit.visitDate?.toDate ? visit.visitDate.toDate().toISOString().split('T')[0] : null;

      // 編輯模式：直接使用已儲存的價格，不重新計算
      // 使用 originalPrice 欄位（如果存在），否則使用 finalPrice/price
      const savedOriginalPrice = visit.originalPrice || visit.finalPrice || visit.price || 0;
      const savedFinalPrice = visit.finalPrice || visit.price || 0;

      // 判斷是否為 VIP 價格（用於顯示）
      const isVIPPrice = visit.discount === 0.5 || visit.discount === '0.5' ||
                         visit.membershipType === 'vip' ||
                         (visit.originalPrice && visit.finalPrice && visit.finalPrice < visit.originalPrice);

      setFormData({
        customerId: visit.customerId || '',
        customerName: visit.customerName || '',
        serviceId: visit.serviceId || '',
        serviceName: visit.serviceName || '',
        visitDate: visitDate || '',
        duration: visit.duration || 60,
        originalPrice: savedOriginalPrice,
        price: savedFinalPrice,
        isVIP: isVIPPrice,
        useSelfOil: visit.useSelfOil || false,
        extraOilFee: visit.extraOilFee || 0,
        paymentMethod: visit.paymentMethod || 'cash',
        paymentStatus: visit.paymentStatus || 'unpaid',
        notes: visit.notes || ''
      });
    } else {
      setIsEditing(false);
      setCurrentVisit(null);
      setFormData({
        customerId: '',
        customerName: '',
        serviceId: '',
        serviceName: '',
        visitDate: new Date().toISOString().split('T')[0],
        duration: 60,
        originalPrice: 0,
        price: 0,
        isVIP: false,
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentVisit(null);
  };

  // 檢查VIP是否在有效期內
  const isVIPValid = (customer, visitDate = null) => {
    if (!customer || customer.membershipLevel !== 'vip') {
      return false;
    }

    // 如果客戶有VIP結束日期，檢查是否在有效期內
    if (customer.vipEndDate) {
      const vipEndDate = customer.vipEndDate.toDate ? customer.vipEndDate.toDate() : new Date(customer.vipEndDate);
      const checkDate = visitDate ? new Date(visitDate) : new Date();

      // 檢查來店日期是否在VIP有效期內
      return checkDate <= vipEndDate;
    }

    // 如果沒有結束日期，表示VIP永久有效
    return true;
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      // 編輯模式：只更新客戶資訊，不重新計算價格
      if (isEditing) {
        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: customer.name || ''
        }));
      } else {
        // 新增模式：檢查客戶是否為VIP且在有效期內，並計算價格
        const visitDate = formData.visitDate || new Date().toISOString().split('T')[0];
        const isVIP = isVIPValid(customer, visitDate);
        const currentPrice = formData.originalPrice || formData.price;

        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: customer.name || '',
          isVIP: isVIP,
          useSelfOil: false, // 切換客戶時重置自備精油選項
          extraOilFee: 0, // 切換客戶時重置額外費用
          price: isVIP && currentPrice > 0 ? Math.round(currentPrice * 0.5) : currentPrice
        }));
      }
    }
  };

  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const serviceName = service.name?.zh || service.name?.en || service.name || '未命名療程';

      // 編輯模式：只更新療程資訊，不重新計算價格
      if (isEditing) {
        setFormData(prev => ({
          ...prev,
          serviceId: service.id,
          serviceName: serviceName,
          duration: service.duration || 60
        }));
      } else {
        // 新增模式：根據VIP狀態和精油選項計算價格
        const originalPrice = service.price || 0;
        const selfOilPrice = service.selfOilPrice || originalPrice;

        let finalPrice;
        if (formData.isVIP) {
          // VIP：使用 VIP 折扣價（含精油）+ 額外費用
          finalPrice = Math.round(originalPrice * 0.5) + (formData.extraOilFee || 0);
        } else {
          // 一般客戶：如果自備精油使用 selfOilPrice，否則使用原價
          finalPrice = formData.useSelfOil ? selfOilPrice : originalPrice;
        }

        setFormData(prev => ({
          ...prev,
          serviceId: service.id,
          serviceName: serviceName,
          duration: service.duration || 60,
          originalPrice: originalPrice,
          price: finalPrice
        }));
      }
    }
  };

  const handleDateChange = (newDate) => {
    // 編輯模式：只更新日期，不重新計算價格
    if (isEditing) {
      setFormData(prev => ({ ...prev, visitDate: newDate }));
    } else {
      // 新增模式：更新日期並重新檢查VIP有效性
      setFormData(prev => ({ ...prev, visitDate: newDate }));

      // 如果已選擇客戶，重新檢查VIP有效性
      if (formData.customerId) {
        const customer = customers.find(c => c.id === formData.customerId);
        if (customer) {
          const isVIP = isVIPValid(customer, newDate);
          const originalPrice = formData.originalPrice || formData.price;
          const calculatedPrice = isVIP ? Math.round(originalPrice * 0.5) : originalPrice;

          setFormData(prev => ({
            ...prev,
            visitDate: newDate,
            isVIP: isVIP,
            price: calculatedPrice
          }));
        }
      }
    }
  };

  // 處理自備精油勾選（一般客戶）
  const handleSelfOilChange = (checked) => {
    if (isEditing) return; // 編輯模式不允許修改

    const service = services.find(s => s.id === formData.serviceId);
    if (!service) return;

    const originalPrice = service.price || 0;
    const selfOilPrice = service.selfOilPrice || originalPrice;
    const newPrice = checked ? selfOilPrice : originalPrice;

    setFormData(prev => ({
      ...prev,
      useSelfOil: checked,
      price: newPrice
    }));
  };

  // 處理VIP額外精油費用
  const handleExtraOilFeeChange = (fee) => {
    if (isEditing) return; // 編輯模式不允許修改

    const service = services.find(s => s.id === formData.serviceId);
    if (!service) return;

    const originalPrice = service.price || 0;
    const vipBasePrice = Math.round(originalPrice * 0.5);
    const newPrice = vipBasePrice + fee;

    setFormData(prev => ({
      ...prev,
      extraOilFee: fee,
      price: newPrice
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.customerId || !formData.serviceId || !formData.visitDate) {
      toast({
        title: '資料不完整',
        description: '請填寫所有必填欄位',
        variant: 'destructive'
      });
      return;
    }

    // Check deposit balance if payment method is deposit
    if (formData.paymentMethod === 'deposit') {
      const customer = customers.find(c => c.id === formData.customerId);
      if (!customer) {
        toast({
          title: '找不到客戶',
          description: '請選擇有效的客戶',
          variant: 'destructive'
        });
        return;
      }

      const currentBalance = customer.balance || 0;
      const price = formData.price || 0;

      if (currentBalance < price) {
        toast({
          title: '儲值餘額不足',
          description: `目前餘額：NT$ ${currentBalance}，需要：NT$ ${price}`,
          variant: 'destructive'
        });
        return;
      }
    }

    try {
      const visitData = {
        ...formData,
        visitDate: Timestamp.fromDate(new Date(formData.visitDate + 'T00:00:00'))
      };

      if (isEditing && currentVisit) {
        // 編輯模式：確認付款，將付款狀態設為已付款
        visitData.paymentStatus = 'paid';
        await updateVisit(currentVisit.id, visitData);
        toast({
          title: '付款確認成功',
          description: '來店記錄付款狀態已更新為已付款'
        });
      } else {
        // 新增模式：創建新記錄
        await createVisit(visitData);
        toast({
          title: '新增成功',
          description: '來店記錄已建立'
        });
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('儲存來店記錄失敗:', error);
      toast({
        title: '操作失敗',
        description: error.message || '無法儲存來店記錄',
        variant: 'destructive'
      });
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此來店記錄嗎？\n如果使用儲值付款，餘額將會退回。')) return;

    try {
      await deleteVisit(id);
      toast({
        title: '刪除成功',
        description: '來店記錄已刪除'
      });
      loadData();
    } catch (error) {
      console.error('刪除來店記錄失敗:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除來店記錄',
        variant: 'destructive'
      });
    }
  };

  // Handle View Customer Stats
  const handleViewCustomerStats = async (customerId, customerName) => {
    try {
      const stats = await getCustomerVisitStats(customerId);
      setCustomerStats({
        ...stats,
        customerName
      });
      setIsStatsDialogOpen(true);
    } catch (error) {
      console.error('取得客戶統計失敗:', error);
      toast({
        title: '取得失敗',
        description: '無法取得客戶統計資料',
        variant: 'destructive'
      });
    }
  };

  // Filter Visits
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = searchTerm === '' ||
      visit.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayment = paymentFilter === 'all' || visit.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Payment Method Badge
  const getPaymentBadge = (method) => {
    const paymentConfig = {
      cash: { label: '現金', icon: DollarSign, variant: 'default' },
      card: { label: '刷卡', icon: CreditCard, variant: 'secondary' },
      deposit: { label: '儲值', icon: Wallet, variant: 'outline' }
    };

    const config = paymentConfig[method] || paymentConfig.cash;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Format Date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總來店次數</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              總營收：NT$ {stats.totalRevenue?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日來店</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground mt-1">
              營收：NT$ {stats.todayRevenue?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月來店</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              營收：NT$ {stats.thisMonthRevenue?.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">付款統計</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>現金</span>
                <span className="font-medium">NT$ {stats.paymentMethods?.cash?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>刷卡</span>
                <span className="font-medium">NT$ {stats.paymentMethods?.card?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>儲值</span>
                <span className="font-medium">NT$ {stats.paymentMethods?.deposit?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>來店記錄管理</CardTitle>
              <CardDescription>管理所有客戶來店消費記錄</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              新增來店記錄
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋客戶姓名、療程或備註..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="付款方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部付款方式</SelectItem>
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="card">刷卡</SelectItem>
                <SelectItem value="deposit">儲值</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visits Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>客戶姓名</TableHead>
                  <TableHead>療程</TableHead>
                  <TableHead>時長</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>付款方式</TableHead>
                  <TableHead>付款狀態</TableHead>
                  <TableHead>備註</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      沒有找到來店記錄
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit) => {
                    // 判斷是否為VIP折扣（多種判斷條件）
                    const isVIPPrice = visit.discount === 0.5 ||
                                      visit.discount === '0.5' ||
                                      visit.membershipType === 'vip' ||
                                      (visit.originalPrice && visit.finalPrice && visit.finalPrice < visit.originalPrice);
                    const priceAmount = (visit.finalPrice || visit.price || 0).toLocaleString();

                    return (
                      <TableRow key={visit.id}>
                        <TableCell>{formatDate(visit.visitDate)}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleViewCustomerStats(visit.customerId, visit.customerName)}
                            className="font-medium hover:text-blue-600 underline"
                          >
                            {visit.customerName}
                          </button>
                        </TableCell>
                        <TableCell>
                          {visit.serviceName}
                          {visit.useSelfOil && (
                            <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                              自備精油
                            </Badge>
                          )}
                          {visit.extraOilFee > 0 && (
                            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-600">
                              +NT$ {visit.extraOilFee}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{visit.duration} 分鐘</TableCell>
                        <TableCell className={`font-medium ${isVIPPrice ? 'text-red-600' : ''}`}>
                          NT$ {priceAmount}
                        </TableCell>
                      <TableCell>{getPaymentBadge(visit.paymentMethod)}</TableCell>
                      <TableCell>
                        <Badge variant={visit.paymentStatus === 'paid' ? 'success' : 'secondary'}>
                          {visit.paymentStatus === 'paid' ? '已付款' : '未付款'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{visit.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {visit.paymentStatus !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(visit)}
                              title="編輯來店記錄"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(visit.id)}
                            title="刪除來店記錄"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? '編輯來店記錄' : '新增來店記錄'}</DialogTitle>
            <DialogDescription>
              {isEditing ? '修改來店記錄資訊' : '建立新的來店記錄'}
            </DialogDescription>
          </DialogHeader>

          {/* 調試信息 - 正式環境請移除 */}
          {isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
              <div>isEditing: {isEditing ? '是' : '否'}</div>
              <div>isVIP: {formData.isVIP ? '是' : '否'}</div>
              <div>serviceId: {formData.serviceId || '無'}</div>
              <div>useSelfOil: {formData.useSelfOil ? '是' : '否'}</div>
              <div>extraOilFee: {formData.extraOilFee}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="customerId">客戶 *</Label>
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
                        {customer.balance > 0 && ` (餘額：NT$ ${customer.balance})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="serviceId">療程項目 *</Label>
                {isEditing ? (
                  <Input
                    id="serviceId"
                    type="text"
                    value={formData.serviceName}
                    readOnly
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={formData.serviceId}
                    onValueChange={handleServiceChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇療程" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => {
                        const displayName = service.name?.zh || service.name?.en || service.name || '未命名療程';
                        return (
                          <SelectItem key={service.id} value={service.id}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {isEditing && (
                  <p className="text-xs text-muted-foreground">編輯模式下無法修改療程</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitDate">來店日期 *</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">療程時長（分鐘）</Label>
                <Input
                  id="duration"
                  type="text"
                  value={`${formData.duration} 分鐘`}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">自動從療程管理帶入</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">金額</Label>
                <Input
                  id="price"
                  type="text"
                  value={`NT$ ${formData.price}`}
                  readOnly
                  disabled
                  className={`bg-muted cursor-not-allowed ${formData.isVIP ? 'text-red-600 font-semibold' : ''}`}
                />
                <p className="text-xs text-muted-foreground">自動從療程管理帶入</p>
              </div>

              {/* 一般客戶：自備精油選項 */}
              {!formData.isVIP && formData.serviceId && (
                <div className="space-y-2 col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useSelfOil"
                      checked={formData.useSelfOil}
                      onChange={(e) => handleSelfOilChange(e.target.checked)}
                      disabled={isEditing}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <Label htmlFor="useSelfOil" className={isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
                      自備精油（使用優惠價格）
                    </Label>
                  </div>
                  {formData.useSelfOil && (
                    <p className="text-xs text-green-600">
                      ✓ 已套用自備精油優惠價格
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      編輯模式下無法修改精油選項
                    </p>
                  )}
                </div>
              )}

              {/* VIP客戶：忘記帶精油額外費用 */}
              {formData.isVIP && formData.serviceId && (
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="extraOilFee">忘記帶精油額外費用</Label>
                  <Select
                    value={formData.extraOilFee.toString()}
                    onValueChange={(value) => handleExtraOilFeeChange(parseInt(value))}
                    disabled={isEditing}
                  >
                    <SelectTrigger className={isEditing ? 'opacity-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">無需額外付費</SelectItem>
                      <SelectItem value="100">+ NT$ 100</SelectItem>
                      <SelectItem value="200">+ NT$ 200</SelectItem>
                      <SelectItem value="300">+ NT$ 300</SelectItem>
                      <SelectItem value="400">+ NT$ 400</SelectItem>
                      <SelectItem value="500">+ NT$ 500</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.extraOilFee > 0 && (
                    <p className="text-xs text-orange-600">
                      ⚠ 已加收精油費用 NT$ {formData.extraOilFee}
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      編輯模式下無法修改精油選項
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">付款方式</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">現金</SelectItem>
                    <SelectItem value="card">刷卡</SelectItem>
                    <SelectItem value="deposit">儲值扣款</SelectItem>
                  </SelectContent>
                </Select>
                {formData.paymentMethod === 'deposit' && formData.customerId && (
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const customer = customers.find(c => c.id === formData.customerId);
                      const balance = customer?.balance || 0;
                      const remaining = balance - formData.price;
                      return `目前餘額：NT$ ${balance}，扣款後剩餘：NT$ ${remaining}`;
                    })()}
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
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
              <Button type="submit">
                {isEditing ? '確認付款' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>客戶消費統計</DialogTitle>
            <DialogDescription>
              {customerStats?.customerName} 的消費記錄
            </DialogDescription>
          </DialogHeader>

          {customerStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      總來店次數
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customerStats.totalVisits}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      總消費金額
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      NT$ {customerStats.totalSpent?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">最後來店日期</span>
                  <span className="font-medium">
                    {customerStats.lastVisit ? formatDate(customerStats.lastVisit) : '-'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">最常消費療程</span>
                  <span className="font-medium">
                    {customerStats.favoriteService || '-'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">平均消費金額</span>
                  <span className="font-medium">
                    NT$ {customerStats.totalVisits > 0 ?
                      Math.round(customerStats.totalSpent / customerStats.totalVisits).toLocaleString() : 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsStatsDialogOpen(false)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitManagement;
