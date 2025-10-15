import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { UserPlus, Search, Edit, Trash2, Phone, Mail, Wallet, Crown, TrendingUp } from 'lucide-react';
import { getAllCustomers, createCustomer, updateCustomer, deleteCustomer, searchCustomers, getMembershipInfo, depositBalance, upgradeToVIP } from '../services/customerService';
import { useToast } from '@/hooks/use-toast';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState('');
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
    setDepositAmount('');
    setDepositType('');
    setIsDepositDialogOpen(true);
  };

  const handleDeposit = async () => {
    if (!depositType) {
      toast({
        title: '請選擇儲值方案',
        variant: 'destructive'
      });
      return;
    }

    const amounts = {
      '20k': 20000,
      '30k': 30000,
      '50k': 50000
    };

    const amount = amounts[depositType];

    try {
      await depositBalance(selectedCustomer.id, amount, depositType);
      toast({
        title: '儲值成功',
        description: `已儲值 $${amount.toLocaleString()}`
      });
      setIsDepositDialogOpen(false);
      loadCustomers();
    } catch (error) {
      toast({
        title: '儲值失敗',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpgradeToVIP = async (customer) => {
    try {
      await upgradeToVIP(customer.id);
      toast({
        title: '升級成功',
        description: `${customer.name} 已升級為VIP會員`
      });
      loadCustomers();
    } catch (error) {
      toast({
        title: '升級失敗',
        description: error.message,
        variant: 'destructive'
      });
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
                          <div className="flex items-center text-sm font-medium">
                            <Wallet className="w-3 h-3 mr-1 text-green-600" />
                            ${(customer.balance || 0).toLocaleString()}
                          </div>
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
                                onClick={() => handleUpgradeToVIP(customer)}
                                title="升級VIP"
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

            <div className="space-y-3">
              <Label>選擇儲值方案</Label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setDepositType('20k')}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    depositType === '20k' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-lg">儲值 2 萬</div>
                      <div className="text-sm text-muted-foreground">升級為儲值會員 2萬</div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">$20,000</div>
                  </div>
                </button>

                <button
                  onClick={() => setDepositType('30k')}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    depositType === '30k' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-lg">儲值 3 萬</div>
                      <div className="text-sm text-muted-foreground">升級為儲值會員 3萬</div>
                    </div>
                    <div className="text-xl font-bold text-purple-600">$30,000</div>
                  </div>
                </button>

                <button
                  onClick={() => setDepositType('50k')}
                  className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                    depositType === '50k' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-lg">儲值 5 萬</div>
                      <div className="text-sm text-muted-foreground">升級為儲值會員 5萬</div>
                    </div>
                    <div className="text-xl font-bold text-amber-600">$50,000</div>
                  </div>
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
    </div>
  );
}
