import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllCustomers, getMembershipStats } from '../services/customerService';
import { getSubscriberStats } from '../services/newsletterService';
import { getMessageStats } from '../services/contactService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 使用動態導入優化初始加載
const CustomerManagement = lazy(() => import('./CustomerManagement'));
const ServiceManagement = lazy(() => import('./ServiceManagement'));
const BookingManagement = lazy(() => import('./BookingManagement'));
const VisitManagement = lazy(() => import('./VisitManagement'));
const ContentManagement = lazy(() => import('./ContentManagement'));
const SettingsManagement = lazy(() => import('./SettingsManagement'));
const MessageCenter = lazy(() => import('./MessageCenter'));
const Reports = lazy(() => import('./Reports'));
import {
  LayoutDashboard,
  Users,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  Flower2,
  Crown,
  MessageSquare,
  Mail,
  BarChart3,
  Calendar,
  ClipboardList
} from 'lucide-react';

// 加載中組件
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">載入中...</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newsletterSubscribers: 0,
    unreadMessages: 0
  });
  const [membershipStats, setMembershipStats] = useState({
    regular: 0,
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

      const [customersData, membershipData, subscriberData, messageData] = await Promise.all([
        getAllCustomers(),
        getMembershipStats(),
        getSubscriberStats(),
        getMessageStats()
      ]);

      setStats({
        totalCustomers: customersData.length,
        newsletterSubscribers: subscriberData.total || 0,
        unreadMessages: messageData.unread || 0
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
      title: '總會員數',
      value: loading ? '-' : stats.totalCustomers.toString(),
      icon: Users,
      trend: '',
      color: 'text-primary'
    },
    {
      title: '電子報訂閱',
      value: loading ? '-' : stats.newsletterSubscribers.toString(),
      icon: Mail,
      trend: '',
      color: 'text-primary'
    },
    {
      title: '未讀訊息',
      value: loading ? '-' : stats.unreadMessages.toString(),
      icon: MessageSquare,
      trend: '',
      color: stats.unreadMessages > 0 ? 'text-destructive' : 'text-muted-foreground'
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
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              預約管理
            </TabsTrigger>
            <TabsTrigger value="visits" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="w-4 h-4 mr-2" />
              來店記錄
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              客戶管理
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="w-4 h-4 mr-2" />
              療程管理
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              報表分析
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="w-4 h-4 mr-2" />
              訊息中心
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-600">{membershipStats.regular}</div>
                      <div className="text-sm text-muted-foreground mt-1">一般會員</div>
                    </div>
                    <div className="p-4 bg-rose-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-rose-600">{membershipStats.vip}</div>
                      <div className="text-sm text-muted-foreground mt-1">VIP會員</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{membershipStats.withDeposit || 0}</div>
                      <div className="text-sm text-muted-foreground mt-1">有儲值客戶</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-600">
                        NT$ {Math.round((membershipStats.totalBalance || 0) / 1000)}K
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">總儲值餘額</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 其他標籤頁內容 */}
          <TabsContent value="bookings">
            <Suspense fallback={<LoadingSpinner />}>
              <BookingManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="visits">
            <Suspense fallback={<LoadingSpinner />}>
              <VisitManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="customers">
            <Suspense fallback={<LoadingSpinner />}>
              <CustomerManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="services">
            <Suspense fallback={<LoadingSpinner />}>
              <ServiceManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="reports">
            <Suspense fallback={<LoadingSpinner />}>
              <Reports />
            </Suspense>
          </TabsContent>

          <TabsContent value="messages">
            <Suspense fallback={<LoadingSpinner />}>
              <MessageCenter />
            </Suspense>
          </TabsContent>

          <TabsContent value="content">
            <Suspense fallback={<LoadingSpinner />}>
              <ContentManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings">
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsManagement />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
