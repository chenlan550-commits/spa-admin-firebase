import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { UserPlus, Search, Edit, Trash2, Phone, Mail, Wallet, Crown, TrendingUp, Users, Eye, Receipt, ClipboardList } from 'lucide-react';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer, searchCustomers, getMembershipInfo, addDeposit, checkLowBalance, purchaseVIP, approveVIP, getVIPEligibleCustomers, getDepositRecords } from '../services/customerService';
import { getVisitsByCustomerId } from '../services/visitService';
import { useToast } from '@/hooks/use-toast';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isPurchaseVIPDialogOpen, setIsPurchaseVIPDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [vipPaymentMethod, setVipPaymentMethod] = useState('cash');
  const [depositAmount, setDepositAmount] = useState(1000);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [depositRecords, setDepositRecords] = useState([]);
  const [visitRecords, setVisitRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const { toast } = useToast();

  // 載入客戶列表
  useEffect(() => {
    loadCustomers();
  }, []);

  // 搜尋過濾
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      toast({
        title: '載入失敗',
        description: '無法載入客戶列表，請稍後再試',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast({
        title: '欄位缺失',
        description: '請填寫姓名和電話',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
        toast({
          title: '更新成功',
          description: '客戶資料已更新'
        });
      } else {
        await createCustomer(formData);
        toast({
          title: '新增成功',
          description: '客戶已成功新增'
        });
      }
      handleCloseDialog();
      loadCustomers();
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
      await deleteCustomer(selectedCustomer.id);
      toast({
        title: '刪除成功',
        description: '客戶已被刪除'
      });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleOpenDeleteDialog = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenDepositDialog = (customer) => {
    setSelectedCustomer(customer);
    setDepositAmount(1000);
    setBonusAmount(0);
    setPaymentMethod('cash');
    setIsDepositDialogOpen(true);
  };

  const handleDeposit = async () => {
    if (depositAmount < 1000) {
      toast({
        title: '儲值金額不足',
        description: '最低儲值金額為 NT$ 1,000',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedCustomer || !selectedCustomer.id) {
      toast({
        title: '儲值失敗',
        description: '未選擇客戶',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('開始儲值:', {
        customerId: selectedCustomer.id,
        depositAmount,
        bonusAmount,
        paymentMethod
      });

      const result = await addDeposit(
        selectedCustomer.id,
        depositAmount,
        bonusAmount,
        paymentMethod,
        '系統管理員',
        ''
      );

      console.log('儲值成功:', result);

      toast({
        title: '儲值成功',
        description: result.message || `已儲值 NT$ ${depositAmount.toLocaleString()}`,
      });
      setIsDepositDialogOpen(false);
      setDepositAmount(1000);
      setBonusAmount(0);
      setPaymentMethod('cash');
      loadCustomers();
    } catch (error) {
      console.error('儲值失敗詳細錯誤:', error);
      toast({
        title: '儲值失敗',
        description: error.message || '發生未知錯誤',
        variant: 'destructive'
      });
    }
  };

  const handleOpenPurchaseVIPDialog = (customer) => {
    setSelectedCustomer(customer);
    setVipPaymentMethod('cash');
    setIsPurchaseVIPDialogOpen(true);
  };

  const handlePurchaseVIP = async () => {
    if (!selectedCustomer) return;

    try {
      const result = await purchaseVIP(selectedCustomer.id, vipPaymentMethod, '系統管理員');
      toast({
        title: '購買成功',
        description: result.message
      });
      setIsPurchaseVIPDialogOpen(false);
      setVipPaymentMethod('cash');
      loadCustomers();
    } catch (error) {
      toast({
        title: '購買失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleOpenDetailsDialog = async (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsDialogOpen(true);
    setRecordsLoading(true);

    try {
      const [deposits, visits] = await Promise.all([
        getDepositRecords(customer.id),
        getVisitsByCustomerId(customer.id)
      ]);
      setDepositRecords(deposits);
      setVisitRecords(visits);
    } catch (error) {
      toast({
        title: '載入記錄失敗',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRecordsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>客戶管理</CardTitle>
              <CardDescription>管理所有客戶資料與記錄</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <UserPlus className="w-4 h-4 mr-2" />
              新增客戶
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜尋欄 */}
          <div className="flex items-center space-x-2 mb-6">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋客戶姓名、電話或郵箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* 客戶列表 */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '找不到符合的客戶' : '尚無客戶資料'}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>聯絡方式</TableHead>
                    <TableHead>會員等級</TableHead>
                    <TableHead>餘額</TableHead>
                    <TableHead>消費次數</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const membershipInfo = getMembershipInfo(customer.membershipLevel || 'regular');
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            {customer.phone && (
                              <div className="flex items-center text-xs text-muted-foreground mt-1">
                                <Phone className="w-3 h-3 mr-1" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Mail className="w-3 h-3 mr-1" />
                                {customer.email}
                              </div>
                            )}
                            {customer.address && (
                              <div className="text-xs text-muted-foreground truncate max-w-xs">
                                {customer.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${membershipInfo.bgColor} ${membershipInfo.color}`}>
                            {membershipInfo.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const balanceCheck = checkLowBalance(customer);
                            return (
                              <div className="space-y-1">
                                <div className={`flex items-center text-sm font-medium ${balanceCheck.isLow ? 'text-red-600' : 'text-green-600'}`}>
                                  <Wallet className={`w-3 h-3 mr-1 ${balanceCheck.isLow ? 'text-red-600' : 'text-green-600'}`} />
                                  NT$ {(customer.balance || 0).toLocaleString()}
                                </div>
                                {balanceCheck.isLow && (
                                  <div className="text-xs text-red-600">
                                    餘額不足
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
                            {customer.visitCount || 0} 次
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetailsDialog(customer)}
                              title="查看明細"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(customer)}
                              title="編輯"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDepositDialog(customer)}
                              title="儲值"
                            >
                              <Wallet className="w-4 h-4 text-green-600" />
                            </Button>
                            {customer.membershipLevel !== 'vip' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPurchaseVIPDialog(customer)}
                                title="購買VIP"
                              >
                                <Crown className="w-4 h-4 text-amber-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(customer)}
                              title="刪除"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? '編輯客戶' : '新增客戶'}</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? '更新客戶資料' : '新增一位新客戶'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話 *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">郵箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
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
                {selectedCustomer ? '更新' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此客戶嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。客戶資料將被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 儲值對話框 */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>會員儲值</DialogTitle>
            <DialogDescription>
              為 {selectedCustomer?.name} 進行儲值
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomer && (
              <div className="p-4 bg-accent/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">當前會員等級：</span>
                  <span className="font-medium">
                    {getMembershipInfo(selectedCustomer.membershipLevel || 'regular').label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">當前餘額：</span>
                  <span className="font-medium text-green-600">
                    ${(selectedCustomer.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>儲值金額（以千元為單位）</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDepositAmount(prev => Math.max(1000, prev - 1000))}
                    className="h-12 w-12"
                  >
                    <span className="text-xl">−</span>
                  </Button>
                  <div className="flex-1 text-center p-4 bg-primary/5 rounded-lg border-2 border-primary">
                    <div className="text-3xl font-bold text-primary">
                      NT$ {depositAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">實付金額</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setDepositAmount(prev => prev + 1000)}
                    className="h-12 w-12"
                  >
                    <span className="text-xl">+</span>
                  </Button>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(5000)}
                    className="flex-1"
                  >
                    NT$ 5K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(10000)}
                    className="flex-1"
                  >
                    NT$ 10K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(20000)}
                    className="flex-1"
                  >
                    NT$ 20K
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(50000)}
                    className="flex-1"
                  >
                    NT$ 50K
                  </Button>
                </div>
              </div>

              <div>
                <Label>贈送紅利（可選）</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setBonusAmount(prev => Math.max(0, prev - 1000))}
                    className="h-12 w-12"
                  >
                    <span className="text-xl">−</span>
                  </Button>
                  <div className="flex-1 text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      + NT$ {bonusAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">贈送金額</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setBonusAmount(prev => prev + 1000)}
                    className="h-12 w-12"
                  >
                    <span className="text-xl">+</span>
                  </Button>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBonusAmount(0)}
                    className="flex-1"
                  >
                    無贈送
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBonusAmount(Math.round(depositAmount * 0.1))}
                    className="flex-1"
                  >
                    10%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBonusAmount(Math.round(depositAmount * 0.15))}
                    className="flex-1"
                  >
                    15%
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex justify-between items-center text-lg font-medium">
                  <span>總儲值金額：</span>
                  <span className="text-2xl text-amber-600">
                    NT$ {(depositAmount + bonusAmount).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  = 實付 NT$ {depositAmount.toLocaleString()} + 贈送 NT$ {bonusAmount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>支付方式</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 border-2 rounded-lg text-center transition-all hover:border-primary ${
                    paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="font-medium">現金</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 border-2 rounded-lg text-center transition-all hover:border-primary ${
                    paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="font-medium">刷卡</div>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDepositDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleDeposit}>
              確認儲值
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIP購買對話框 */}
      <Dialog open={isPurchaseVIPDialogOpen} onOpenChange={setIsPurchaseVIPDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>購買VIP會員</DialogTitle>
            <DialogDescription>
              為 {selectedCustomer?.name} 購買VIP會員資格
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomer && (
              <div className="p-4 bg-accent/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">當前會員等級：</span>
                  <span className="font-medium">
                    {getMembershipInfo(selectedCustomer.membershipLevel || 'regular').label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">當前餘額：</span>
                  <span className="font-medium text-green-600">
                    ${(selectedCustomer.balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border-2 border-rose-200">
              <div className="text-center space-y-2">
                <Crown className="w-12 h-12 mx-auto text-rose-600" />
                <div className="text-sm text-muted-foreground">VIP會員價格</div>
                <div className="text-4xl font-bold text-rose-600">
                  NT$ 20,000
                </div>
                <div className="text-xs text-muted-foreground">
                  升級後可享VIP會員專屬優惠
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>支付方式</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setVipPaymentMethod('cash')}
                  className={`p-3 border-2 rounded-lg text-center transition-all hover:border-primary ${
                    vipPaymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="font-medium">現金</div>
                </button>
                <button
                  onClick={() => setVipPaymentMethod('card')}
                  className={`p-3 border-2 rounded-lg text-center transition-all hover:border-primary ${
                    vipPaymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="font-medium">刷卡</div>
                </button>
                <button
                  onClick={() => setVipPaymentMethod('deposit')}
                  className={`p-3 border-2 rounded-lg text-center transition-all hover:border-primary ${
                    vipPaymentMethod === 'deposit' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  disabled={selectedCustomer && selectedCustomer.balance < 20000}
                >
                  <div className="font-medium">儲值扣款</div>
                  {selectedCustomer && selectedCustomer.balance < 20000 && (
                    <div className="text-xs text-red-500 mt-1">餘額不足</div>
                  )}
                </button>
              </div>
              {vipPaymentMethod === 'deposit' && selectedCustomer && selectedCustomer.balance >= 20000 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700">
                    扣款後餘額：NT$ {(selectedCustomer.balance - 20000).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPurchaseVIPDialogOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={handlePurchaseVIP}
              disabled={vipPaymentMethod === 'deposit' && selectedCustomer && selectedCustomer.balance < 20000}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              確認購買
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 客戶明細對話框 */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>客戶明細 - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              查看儲值記錄與消費記錄
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="visits" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visits">
                <ClipboardList className="w-4 h-4 mr-2" />
                消費記錄
              </TabsTrigger>
              <TabsTrigger value="deposit">
                <Receipt className="w-4 h-4 mr-2" />
                儲值記錄
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visits" className="space-y-4">
              {recordsLoading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : visitRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">尚無消費記錄</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日期</TableHead>
                        <TableHead>服務項目</TableHead>
                        <TableHead>原價</TableHead>
                        <TableHead>折扣</TableHead>
                        <TableHead>實付金額</TableHead>
                        <TableHead>付款方式</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.visitDate?.toDate?.()?.toLocaleString('zh-TW') || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{record.serviceName || '-'}</span>
                          </TableCell>
                          <TableCell>
                            NT$ {(record.price || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {record.discount > 0 ? (
                              <span className="text-green-600">
                                -{record.discount}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">無</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-blue-600">
                              NT$ {(record.finalPrice || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {record.paymentMethod === 'cash' ? '現金' :
                             record.paymentMethod === 'card' ? '刷卡' :
                             record.paymentMethod === 'deposit' ? '儲值扣款' : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="deposit" className="space-y-4">
              {recordsLoading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : depositRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">尚無儲值記錄</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日期</TableHead>
                        <TableHead>儲值金額</TableHead>
                        <TableHead>紅利</TableHead>
                        <TableHead>實得金額</TableHead>
                        <TableHead>付款方式</TableHead>
                        <TableHead>收據號</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depositRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.depositDate?.toDate?.()?.toLocaleString('zh-TW') || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              NT$ {(record.depositAmount || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">
                              +NT$ {(record.bonusAmount || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-blue-600">
                              NT$ {(record.totalAmount || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {record.paymentMethod === 'cash' ? '現金' : '刷卡'}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {record.receiptNumber || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" onClick={() => setIsDetailsDialogOpen(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
