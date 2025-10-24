import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  MessageSquare,
  Trash2,
  Download,
  Search,
  Filter,
  CheckCircle,
  Circle,
  CheckCheck,
  Eye,
  MailOpen,
  Languages
} from 'lucide-react';

// 導入服務
import {
  getAllSubscribers,
  getSubscriberStats,
  deleteSubscriber,
  exportSubscribersToCSV,
  downloadCSV as downloadNewsletterCSV
} from '../services/newsletterService';

import {
  getAllMessages,
  getMessageStats,
  deleteMessage,
  markAsRead,
  markAsReplied,
  exportMessagesToCSV,
  downloadCSV as downloadContactCSV
} from '../services/contactService';

export default function MessageCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('newsletter');
  const [loading, setLoading] = useState(true);

  // 電子報訂閱相關狀態
  const [subscribers, setSubscribers] = useState([]);
  const [subscriberStats, setSubscriberStats] = useState({
    total: 0,
    byLanguage: { zh: 0, en: 0, ja: 0 }
  });
  const [subscriberSearch, setSubscriberSearch] = useState('');

  // 聯絡訊息相關狀態
  const [messages, setMessages] = useState([]);
  const [messageStats, setMessageStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0
  });
  const [messageSearch, setMessageSearch] = useState('');
  const [messageFilter, setMessageFilter] = useState('all'); // all, unread, read, replied
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  // 刪除確認對話框
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: '', // 'subscriber' or 'message'
    id: '',
    name: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSubscribers(), loadMessages()]);
    } catch (error) {
      console.error('載入資料失敗:', error);
      toast({
        title: '載入失敗',
        description: '無法載入資料，請重新整理頁面',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubscribers = async () => {
    try {
      const [data, stats] = await Promise.all([
        getAllSubscribers(),
        getSubscriberStats()
      ]);
      setSubscribers(data);
      setSubscriberStats(stats);
    } catch (error) {
      console.error('載入訂閱者失敗:', error);
      throw error;
    }
  };

  const loadMessages = async () => {
    try {
      const [data, stats] = await Promise.all([
        getAllMessages(),
        getMessageStats()
      ]);
      setMessages(data);
      setMessageStats(stats);
    } catch (error) {
      console.error('載入訊息失敗:', error);
      throw error;
    }
  };

  // 篩選訂閱者
  const filteredSubscribers = subscribers.filter(sub =>
    sub.email.toLowerCase().includes(subscriberSearch.toLowerCase())
  );

  // 篩選訊息
  const filteredMessages = messages.filter(msg => {
    const matchSearch =
      msg.name?.toLowerCase().includes(messageSearch.toLowerCase()) ||
      msg.email?.toLowerCase().includes(messageSearch.toLowerCase()) ||
      msg.phone?.includes(messageSearch);

    const matchFilter =
      messageFilter === 'all' || msg.status === messageFilter;

    return matchSearch && matchFilter;
  });

  // 處理刪除訂閱者
  const handleDeleteSubscriber = async (id) => {
    try {
      await deleteSubscriber(id);
      toast({
        title: '刪除成功',
        description: '訂閱者已刪除'
      });
      await loadSubscribers();
    } catch (error) {
      console.error('刪除訂閱者失敗:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除訂閱者',
        variant: 'destructive'
      });
    }
  };

  // 處理刪除訊息
  const handleDeleteMessage = async (id) => {
    try {
      await deleteMessage(id);
      toast({
        title: '刪除成功',
        description: '訊息已刪除'
      });
      await loadMessages();
    } catch (error) {
      console.error('刪除訊息失敗:', error);
      toast({
        title: '刪除失敗',
        description: '無法刪除訊息',
        variant: 'destructive'
      });
    }
  };

  // 處理更新訊息狀態
  const handleUpdateMessageStatus = async (id, status) => {
    try {
      if (status === 'read') {
        await markAsRead(id);
      } else if (status === 'replied') {
        await markAsReplied(id);
      }

      toast({
        title: '更新成功',
        description: `訊息已標記為${status === 'read' ? '已讀' : '已回覆'}`
      });

      await loadMessages();

      // 如果對話框開啟，更新選中的訊息
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
    } catch (error) {
      console.error('更新狀態失敗:', error);
      toast({
        title: '更新失敗',
        description: '無法更新訊息狀態',
        variant: 'destructive'
      });
    }
  };

  // 匯出訂閱者
  const handleExportSubscribers = () => {
    try {
      const csv = exportSubscribersToCSV(filteredSubscribers);
      const filename = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      downloadNewsletterCSV(csv, filename);
      toast({
        title: '匯出成功',
        description: `已匯出 ${filteredSubscribers.length} 筆訂閱者資料`
      });
    } catch (error) {
      console.error('匯出失敗:', error);
      toast({
        title: '匯出失敗',
        description: '無法匯出訂閱者資料',
        variant: 'destructive'
      });
    }
  };

  // 匯出訊息
  const handleExportMessages = () => {
    try {
      const csv = exportMessagesToCSV(filteredMessages);
      const filename = `contact_messages_${new Date().toISOString().split('T')[0]}.csv`;
      downloadContactCSV(csv, filename);
      toast({
        title: '匯出成功',
        description: `已匯出 ${filteredMessages.length} 筆訊息資料`
      });
    } catch (error) {
      console.error('匯出失敗:', error);
      toast({
        title: '匯出失敗',
        description: '無法匯出訊息資料',
        variant: 'destructive'
      });
    }
  };

  // 查看訊息詳情
  const handleViewMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageDialog(true);

    // 如果是未讀，自動標記為已讀
    if (message.status === 'unread') {
      handleUpdateMessageStatus(message.id, 'read');
    }
  };

  // 開啟刪除確認對話框
  const openDeleteDialog = (type, id, name) => {
    setDeleteDialog({
      open: true,
      type,
      id,
      name
    });
  };

  // 確認刪除
  const confirmDelete = async () => {
    const { type, id } = deleteDialog;

    if (type === 'subscriber') {
      await handleDeleteSubscriber(id);
    } else if (type === 'message') {
      await handleDeleteMessage(id);
    }

    setDeleteDialog({ open: false, type: '', id: '', name: '' });
  };

  const getStatusBadge = (status) => {
    const variants = {
      unread: { variant: 'destructive', icon: Circle, text: '未讀' },
      read: { variant: 'secondary', icon: MailOpen, text: '已讀' },
      replied: { variant: 'default', icon: CheckCheck, text: '已回覆' }
    };

    const config = variants[status] || variants.unread;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getLanguageBadge = (language) => {
    const languages = {
      zh: '中文',
      en: 'English',
      ja: '日本語'
    };

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Languages className="w-3 h-3" />
        {languages[language] || language}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              電子報訂閱者
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{subscriberStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">總訂閱人數</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              聯絡訊息總數
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{messageStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">所有訊息</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              未讀訊息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{messageStats.unread}</div>
            <p className="text-xs text-muted-foreground mt-1">待處理訊息</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已回覆
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{messageStats.replied}</div>
            <p className="text-xs text-muted-foreground mt-1">已處理訊息</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要內容 */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  訊息中心
                </CardTitle>
                <CardDescription>管理電子報訂閱者和聯絡訊息</CardDescription>
              </div>
            </div>

            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="newsletter" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                電子報訂閱 ({subscriberStats.total})
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                聯絡訊息 ({messageStats.total})
                {messageStats.unread > 0 && (
                  <Badge variant="destructive" className="ml-1">{messageStats.unread}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {/* 電子報訂閱者 Tab */}
            <TabsContent value="newsletter" className="space-y-4 mt-0">
              {/* 搜尋和操作列 */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋 Email..."
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleExportSubscribers} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  匯出 CSV
                </Button>
              </div>

              {/* 語言統計 */}
              <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">中文: {subscriberStats.byLanguage?.zh || 0}</Badge>
                  <Badge variant="outline">English: {subscriberStats.byLanguage?.en || 0}</Badge>
                  <Badge variant="outline">日本語: {subscriberStats.byLanguage?.ja || 0}</Badge>
                </div>
              </div>

              {/* 訂閱者列表 */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : filteredSubscribers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">無訂閱者資料</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>語言</TableHead>
                        <TableHead>訂閱日期</TableHead>
                        <TableHead>來源</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">{subscriber.email}</TableCell>
                          <TableCell>{getLanguageBadge(subscriber.language)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {subscriber.subscribedAt?.toDate?.()?.toLocaleDateString('zh-TW') || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {subscriber.source === 'website_footer' ? '網站頁尾' : subscriber.source}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog('subscriber', subscriber.id, subscriber.email)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* 聯絡訊息 Tab */}
            <TabsContent value="contact" className="space-y-4 mt-0">
              {/* 搜尋和篩選列 */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋姓名、Email 或電話..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={messageFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageFilter('all')}
                  >
                    全部 ({messageStats.total})
                  </Button>
                  <Button
                    variant={messageFilter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageFilter('unread')}
                  >
                    未讀 ({messageStats.unread})
                  </Button>
                  <Button
                    variant={messageFilter === 'read' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageFilter('read')}
                  >
                    已讀 ({messageStats.read})
                  </Button>
                  <Button
                    variant={messageFilter === 'replied' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageFilter('replied')}
                  >
                    已回覆 ({messageStats.replied})
                  </Button>
                </div>
                <Button onClick={handleExportMessages} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  匯出 CSV
                </Button>
              </div>

              {/* 訊息列表 */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">無訊息資料</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>姓名</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>電話</TableHead>
                        <TableHead>感興趣的服務</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>日期</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMessages.map((message) => (
                        <TableRow
                          key={message.id}
                          className={message.status === 'unread' ? 'bg-muted/30' : ''}
                        >
                          <TableCell className="font-medium">{message.name}</TableCell>
                          <TableCell>{message.email}</TableCell>
                          <TableCell>{message.phone}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {message.service}
                          </TableCell>
                          <TableCell>{getStatusBadge(message.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {message.createdAt?.toDate?.()?.toLocaleDateString('zh-TW') || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMessage(message)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog('message', message.id, message.name)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* 訊息詳情對話框 */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>訊息詳情</DialogTitle>
            <DialogDescription>
              {selectedMessage?.createdAt?.toDate?.()?.toLocaleString('zh-TW')}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">姓名</label>
                  <p className="text-base mt-1">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">電話</label>
                  <p className="text-base mt-1">{selectedMessage.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-base mt-1">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">感興趣的服務</label>
                  <p className="text-base mt-1">{selectedMessage.service}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">語言</label>
                  <div className="mt-1">{getLanguageBadge(selectedMessage.language)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">狀態</label>
                  <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">訊息內容</label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-base whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedMessage?.status === 'unread' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'read')}
              >
                <MailOpen className="w-4 h-4 mr-2" />
                標記已讀
              </Button>
            )}
            {selectedMessage?.status !== 'replied' && (
              <Button
                variant="default"
                onClick={() => handleUpdateMessageStatus(selectedMessage.id, 'replied')}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                標記已回覆
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「{deleteDialog.name}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
