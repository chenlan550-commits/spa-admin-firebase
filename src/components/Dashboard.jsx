import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTodayBookings, getMonthBookings } from '../services/bookingService';
import { getAllCustomers, getMembershipStats } from '../services/customerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerManagement from './CustomerManagement';
import BookingManagement from './BookingManagement';
import ServiceManagement from './ServiceManagement';
import ContentManagement from './ContentManagement';
import SettingsManagement from './SettingsManagement';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  Flower2,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  Crown
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    todayBookings: 0,
    monthBookings: 0,
    totalCustomers: 0,
    monthRevenue: 0,
    recentBookings: []
  });
  const [membershipStats, setMembershipStats] = useState({
    regular: 0,
    deposit_20k: 0,
    deposit_30k: 0,
    deposit_50k: 0,
    vip: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const [todayData, monthData, customersData, membershipData] = await Promise.all([
        getTodayBookings(),
        getMonthBookings(currentYear, currentMonth),
        getAllCustomers(),
        getMembershipStats()
      ]);

      // 計算本月營收（假設每筆預約都有價格）
      const monthRevenue = monthData.reduce((sum, booking) => {
        // 這裡可以根據實際的服務價格計算
        return sum + (booking.price || 0);
      }, 0);

      // 取最近5筆預約
      const recentBookings = [...monthData]
        .sort((a, b) => {
          const dateA = a.bookingDate?.toDate?.() || new Date(0);
          const dateB = b.bookingDate?.toDate?.() || new Date(0);
          return dateB - dateA;
        })
        .slice(0, 5);

      setStats({
        todayBookings: todayData.length,
        monthBookings: monthData.length,
        totalCustomers: customersData.length,
        monthRevenue,
        recentBookings
      });

      setMembershipStats(membershipData);
    } catch (error) {
      console.error('載入統計數據失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const statsCards = [
    {
      title: '今日預約',
      value: loading ? '-' : stats.todayBookings.toString(),
      icon: CalendarCheck,
      trend: '',
      color: 'text-primary'
    },
    {
      title: '本月預約',
      value: loading ? '-' : stats.monthBookings.toString(),
      icon: Calendar,
      trend: '',
      color: 'text-secondary'
    },
    {
      title: '總會員數',
      value: loading ? '-' : stats.totalCustomers.toString(),
      icon: Users,
      trend: '',
      color: 'text-primary'
    },
    {
      title: '本月營收',
      value: loading ? '-' : `$${stats.monthRevenue.toLocaleString()}`,
      icon: TrendingUp,
      trend: '',
      color: 'text-secondary'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/30 via-background to-accent/20">
      {/* 頂部導航欄 */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Flower2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-secondary">香熏緻身心調理館</h1>
              <p className="text-xs text-muted-foreground">後台管理系統</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{currentUser?.email}</p>
              <p className="text-xs text-muted-foreground">管理員</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              儀表板
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              客戶管理
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              預約管理
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="w-4 h-4 mr-2" />
              療程管理
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              內容管理
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-4 h-4 mr-2" />
              設定
            </TabsTrigger>
          </TabsList>

          {/* 儀表板內容 */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-secondary">{stat.value}</div>
                    {stat.trend && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-primary font-medium">{stat.trend}</span> 較上期
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 會員統計卡片 */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-secondary flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-amber-600" />
                  會員等級統計
                </CardTitle>
                <CardDescription>各等級會員分佈</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">載入中...</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-600">{membershipStats.regular}</div>
                      <div className="text-sm text-muted-foreground mt-1">普通會員</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{membershipStats.deposit_20k}</div>
                      <div className="text-sm text-muted-foreground mt-1">儲值 2萬</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{membershipStats.deposit_30k}</div>
                      <div className="text-sm text-muted-foreground mt-1">儲值 3萬</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-600">{membershipStats.deposit_50k}</div>
                      <div className="text-sm text-muted-foreground mt-1">儲值 5萬</div>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-rose-600">{membershipStats.vip}</div>
                      <div className="text-sm text-muted-foreground mt-1">VIP會員</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-secondary">最新預約</CardTitle>
                <CardDescription>最近的客戶預約記錄</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">載入中...</div>
                ) : stats.recentBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">尚無預約記錄</div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-secondary">{booking.customerName || '未知客戶'}</p>
                            <p className="text-sm text-muted-foreground">{booking.serviceName || '未指定療程'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {booking.bookingDate?.toDate?.()
                              ? new Date(booking.bookingDate.toDate()).toLocaleDateString('zh-TW')
                              : '未知日期'}
                          </p>
                          <p className="text-xs text-muted-foreground">{booking.bookingTime || '未知時間'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 其他標籤頁內容 */}
          <TabsContent value="customers">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="bookings">
            <BookingManagement />
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="content">
            <ContentManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

