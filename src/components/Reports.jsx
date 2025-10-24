import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, Award, DollarSign, Calendar } from 'lucide-react';
import {
  getRevenueReport,
  getCustomerRanking,
  getPopularServices,
  getMembershipDistribution,
  exportReportToCSV,
  downloadCSV
} from '../services/reportService';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const MEMBERSHIP_COLORS = {
  regular: '#94a3b8',
  deposit_20k: '#60a5fa',
  deposit_30k: '#a78bfa',
  deposit_50k: '#f472b6',
  vip: '#fbbf24'
};

export default function Reports() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('thisMonth');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // 報表數據
  const [revenueData, setRevenueData] = useState(null);
  const [customerRankingData, setCustomerRankingData] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [membershipData, setMembershipData] = useState(null);

  useEffect(() => {
    updateDateRange(dateRange);
  }, [dateRange]);

  useEffect(() => {
    if (startDate && endDate) {
      loadReportData();
    }
  }, [startDate, endDate]);

  const updateDateRange = (range) => {
    const now = new Date();
    let start, end;

    switch (range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisWeek':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;

      case 'last30Days':
        start = new Date(now);
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    setStartDate(start);
    setEndDate(end);
  };

  const loadReportData = async () => {
    try {
      setLoading(true);

      const [revenue, customers, services, membership] = await Promise.all([
        getRevenueReport(startDate, endDate),
        getCustomerRanking(startDate, endDate, 20),
        getPopularServices(startDate, endDate),
        getMembershipDistribution()
      ]);

      setRevenueData(revenue);
      setCustomerRankingData(customers);
      setServicesData(services);
      setMembershipData(membership);

    } catch (error) {
      console.error('載入報表失敗:', error);
      toast({
        title: '載入失敗',
        description: '無法載入報表數據，請稍後再試',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (type) => {
    try {
      let csvContent, filename;

      switch (type) {
        case 'revenue':
          csvContent = exportReportToCSV(revenueData, 'revenue');
          filename = `營收報表_${dateRange}_${new Date().getTime()}.csv`;
          break;
        case 'customers':
          csvContent = exportReportToCSV(customerRankingData, 'customerRanking');
          filename = `客戶排行_${dateRange}_${new Date().getTime()}.csv`;
          break;
        case 'services':
          csvContent = exportReportToCSV(servicesData, 'services');
          filename = `療程分析_${dateRange}_${new Date().getTime()}.csv`;
          break;
        case 'membership':
          csvContent = exportReportToCSV(membershipData, 'membership');
          filename = `會員分布_${new Date().getTime()}.csv`;
          break;
        default:
          return;
      }

      downloadCSV(csvContent, filename);

      toast({
        title: '匯出成功',
        description: `已成功匯出 ${filename}`
      });
    } catch (error) {
      console.error('匯出失敗:', error);
      toast({
        title: '匯出失敗',
        description: '無法匯出報表，請稍後再試',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMembershipLabel = (level) => {
    const labels = {
      regular: '普通會員',
      deposit_20k: '儲值 2萬',
      deposit_30k: '儲值 3萬',
      deposit_50k: '儲值 5萬',
      vip: 'VIP'
    };
    return labels[level] || level;
  };

  // 準備會員分布圖表數據
  const membershipChartData = membershipData ? Object.entries(membershipData.distribution).map(([level, data]) => ({
    name: getMembershipLabel(level),
    value: data.count,
    balance: data.totalBalance
  })) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">載入報表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題與日期選擇器 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">報表分析</h2>
          <p className="text-muted-foreground">
            {startDate?.toLocaleDateString('zh-TW')} - {endDate?.toLocaleDateString('zh-TW')}
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">今天</SelectItem>
            <SelectItem value="thisWeek">本週</SelectItem>
            <SelectItem value="thisMonth">本月</SelectItem>
            <SelectItem value="last30Days">最近 30 天</SelectItem>
            <SelectItem value="lastMonth">上個月</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 快速統計卡片 */}
      {revenueData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總營收</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                平均每日 {formatCurrency(revenueData.avgDailyRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">來店次數</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueData.totalVisits}</div>
              <p className="text-xs text-muted-foreground">
                平均每日 {revenueData.avgVisitsPerDay.toFixed(1)} 次
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總客戶數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{membershipData?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">
                儲值總額 {formatCurrency(membershipData?.totalBalance || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VIP 會員</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{membershipData?.vipStats.activeVIP || 0}</div>
              <p className="text-xs text-muted-foreground">
                待審核 {membershipData?.vipStats.eligibleForVIP || 0} 人
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 報表標籤頁 */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">營收報表</TabsTrigger>
          <TabsTrigger value="customers">客戶排行</TabsTrigger>
          <TabsTrigger value="services">療程分析</TabsTrigger>
          <TabsTrigger value="membership">會員分布</TabsTrigger>
        </TabsList>

        {/* 營收報表 */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>每日營收趨勢</CardTitle>
                <CardDescription>依日期顯示營收變化</CardDescription>
              </div>
              <Button onClick={() => handleExport('revenue')} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                匯出 CSV
              </Button>
            </CardHeader>
            <CardContent>
              {revenueData && revenueData.dailyRevenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" name="營收" strokeWidth={2} />
                    <Line type="monotone" dataKey="visits" stroke="#10b981" name="來店次數" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">此期間無營收數據</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>付款方式分布</CardTitle>
              <CardDescription>各付款方式營收占比</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData && (
                <div className="grid md:grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: '現金', value: revenueData.paymentMethodRevenue.cash },
                          { name: '刷卡', value: revenueData.paymentMethodRevenue.card },
                          { name: '儲值', value: revenueData.paymentMethodRevenue.deposit }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-violet-500 mr-2"></div>
                        <span>現金</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(revenueData.paymentMethodRevenue.cash)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-pink-500 mr-2"></div>
                        <span>刷卡</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(revenueData.paymentMethodRevenue.card)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                        <span>儲值</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(revenueData.paymentMethodRevenue.deposit)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 客戶排行 */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>客戶消費排行榜</CardTitle>
                <CardDescription>依消費金額排序的客戶列表</CardDescription>
              </div>
              <Button onClick={() => handleExport('customers')} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                匯出 CSV
              </Button>
            </CardHeader>
            <CardContent>
              {customerRankingData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">排名</TableHead>
                      <TableHead>客戶姓名</TableHead>
                      <TableHead>電話</TableHead>
                      <TableHead>會員等級</TableHead>
                      <TableHead className="text-right">消費金額</TableHead>
                      <TableHead className="text-right">來店次數</TableHead>
                      <TableHead>常用療程</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerRankingData.map((customer, index) => (
                      <TableRow key={customer.customerId}>
                        <TableCell className="font-medium">
                          {index + 1 <= 3 ? (
                            <span className="text-xl">{['🥇', '🥈', '🥉'][index]}</span>
                          ) : (
                            index + 1
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.customerName}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            {getMembershipLabel(customer.membershipLevel)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(customer.totalSpent)}
                        </TableCell>
                        <TableCell className="text-right">{customer.visitCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {customer.services.slice(0, 2).join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">此期間無客戶消費數據</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 療程分析 */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>熱門療程分析</CardTitle>
                <CardDescription>療程預約與消費統計</CardDescription>
              </div>
              <Button onClick={() => handleExport('services')} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                匯出 CSV
              </Button>
            </CardHeader>
            <CardContent>
              {servicesData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={servicesData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="serviceName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visitCount" fill="#8b5cf6" name="來店次數" />
                      <Bar dataKey="bookingCount" fill="#ec4899" name="預約次數" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table className="mt-6">
                    <TableHeader>
                      <TableRow>
                        <TableHead>療程名稱</TableHead>
                        <TableHead className="text-right">來店次數</TableHead>
                        <TableHead className="text-right">預約次數</TableHead>
                        <TableHead className="text-right">總次數</TableHead>
                        <TableHead className="text-right">營收</TableHead>
                        <TableHead className="text-right">平均單價</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicesData.map((service) => (
                        <TableRow key={service.serviceName}>
                          <TableCell className="font-medium">{service.serviceName}</TableCell>
                          <TableCell className="text-right">{service.visitCount}</TableCell>
                          <TableCell className="text-right">{service.bookingCount}</TableCell>
                          <TableCell className="text-right font-semibold">{service.totalCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(service.totalRevenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(service.avgPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">此期間無療程數據</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 會員分布 */}
        <TabsContent value="membership" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>會員等級分布</CardTitle>
                <CardDescription>各等級會員人數與儲值統計</CardDescription>
              </div>
              <Button onClick={() => handleExport('membership')} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                匯出 CSV
              </Button>
            </CardHeader>
            <CardContent>
              {membershipData && (
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={membershipChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} (${value})`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {membershipChartData.map((entry, index) => {
                          const level = Object.keys(membershipData.distribution)[index];
                          return <Cell key={`cell-${index}`} fill={MEMBERSHIP_COLORS[level]} />;
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {Object.entries(membershipData.distribution).map(([level, data]) => (
                      <div key={level} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: MEMBERSHIP_COLORS[level] }}
                          ></div>
                          <div>
                            <p className="font-medium">{getMembershipLabel(level)}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} 人 · 平均餘額 {formatCurrency(data.avgBalance)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(data.totalBalance)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {membershipData && (
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">活躍 VIP</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{membershipData.vipStats.activeVIP}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">過期 VIP</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{membershipData.vipStats.expiredVIP}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">待審核 VIP</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{membershipData.vipStats.eligibleForVIP}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
