import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Bell, Phone, MapPin, Globe } from 'lucide-react';
import { getSettings, updateSettings } from '../services/settingsService';
import { useToast } from '@/hooks/use-toast';

const daysOfWeek = [
  { key: 'monday', label: '星期一' },
  { key: 'tuesday', label: '星期二' },
  { key: 'wednesday', label: '星期三' },
  { key: 'thursday', label: '星期四' },
  { key: 'friday', label: '星期五' },
  { key: 'saturday', label: '星期六' },
  { key: 'sunday', label: '星期日' },
];

export default function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    businessHours: {},
    contactInfo: {},
    bookingSettings: {},
    notifications: {}
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      toast({
        title: '載入失敗',
        description: '無法載入系統設定，請稍後再試',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(settings);
      toast({
        title: '儲存成功',
        description: '系統設定已更新'
      });
    } catch (error) {
      toast({
        title: '儲存失敗',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day, field, value) => {
    setSettings({
      ...settings,
      businessHours: {
        ...settings.businessHours,
        [day]: {
          ...settings.businessHours[day],
          [field]: value
        }
      }
    });
  };

  const updateContactInfo = (field, value) => {
    setSettings({
      ...settings,
      contactInfo: {
        ...settings.contactInfo,
        [field]: value
      }
    });
  };

  const updateBookingSettings = (field, value) => {
    setSettings({
      ...settings,
      bookingSettings: {
        ...settings.bookingSettings,
        [field]: value
      }
    });
  };

  const updateNotifications = (field, value) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">載入中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>系統設定</CardTitle>
              <CardDescription>管理系統設定與偏好</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '儲存中...' : '儲存設定'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hours" className="space-y-4">
            <TabsList>
              <TabsTrigger value="hours">
                <Clock className="w-4 h-4 mr-2" />
                營業時間
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Phone className="w-4 h-4 mr-2" />
                聯絡資訊
              </TabsTrigger>
              <TabsTrigger value="booking">
                <Clock className="w-4 h-4 mr-2" />
                預約設定
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="w-4 h-4 mr-2" />
                通知設定
              </TabsTrigger>
            </TabsList>

            {/* 營業時間 */}
            <TabsContent value="hours" className="space-y-4">
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <Card key={day.key}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-24">
                            <Label>{day.label}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={settings.businessHours[day.key]?.isOpen ?? true}
                              onCheckedChange={(checked) =>
                                updateBusinessHours(day.key, 'isOpen', checked)
                              }
                            />
                            <span className="text-sm text-muted-foreground">營業</span>
                          </div>
                          {settings.businessHours[day.key]?.isOpen && (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={settings.businessHours[day.key]?.open || '10:00'}
                                onChange={(e) =>
                                  updateBusinessHours(day.key, 'open', e.target.value)
                                }
                                className="w-32"
                              />
                              <span>-</span>
                              <Input
                                type="time"
                                value={settings.businessHours[day.key]?.close || '20:00'}
                                onChange={(e) =>
                                  updateBusinessHours(day.key, 'close', e.target.value)
                                }
                                className="w-32"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* 聯絡資訊 */}
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">電話</Label>
                  <Input
                    id="phone"
                    value={settings.contactInfo?.phone || ''}
                    onChange={(e) => updateContactInfo('phone', e.target.value)}
                    placeholder="+886 2 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">電子郵件</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.contactInfo?.email || ''}
                    onChange={(e) => updateContactInfo('email', e.target.value)}
                    placeholder="info@example.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">地址</Label>
                  <Input
                    id="address"
                    value={settings.contactInfo?.address || ''}
                    onChange={(e) => updateContactInfo('address', e.target.value)}
                    placeholder="台北市..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lineId">LINE ID</Label>
                  <Input
                    id="lineId"
                    value={settings.contactInfo?.lineId || ''}
                    onChange={(e) => updateContactInfo('lineId', e.target.value)}
                    placeholder="@yourlineid"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={settings.contactInfo?.facebook || ''}
                    onChange={(e) => updateContactInfo('facebook', e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={settings.contactInfo?.instagram || ''}
                    onChange={(e) => updateContactInfo('instagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* 預約設定 */}
            <TabsContent value="booking" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="advanceBookingDays">提前預約天數</Label>
                  <Input
                    id="advanceBookingDays"
                    type="number"
                    value={settings.bookingSettings?.advanceBookingDays || 30}
                    onChange={(e) =>
                      updateBookingSettings('advanceBookingDays', parseInt(e.target.value))
                    }
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    客戶最多可以提前幾天預約
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minBookingHours">最少提前預約時數</Label>
                  <Input
                    id="minBookingHours"
                    type="number"
                    value={settings.bookingSettings?.minBookingHours || 2}
                    onChange={(e) =>
                      updateBookingSettings('minBookingHours', parseInt(e.target.value))
                    }
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    客戶需提前至少幾小時預約
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slotDuration">預約時段（分鐘）</Label>
                  <Input
                    id="slotDuration"
                    type="number"
                    value={settings.bookingSettings?.slotDuration || 60}
                    onChange={(e) =>
                      updateBookingSettings('slotDuration', parseInt(e.target.value))
                    }
                    min="15"
                    step="15"
                  />
                  <p className="text-xs text-muted-foreground">
                    每個預約時段的長度
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bufferTime">緩衝時間（分鐘）</Label>
                  <Input
                    id="bufferTime"
                    type="number"
                    value={settings.bookingSettings?.bufferTime || 15}
                    onChange={(e) =>
                      updateBookingSettings('bufferTime', parseInt(e.target.value))
                    }
                    min="0"
                    step="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    預約之間的緩衝時間
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* 通知設定 */}
            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>電子郵件通知</Label>
                        <p className="text-sm text-muted-foreground">
                          啟用電子郵件通知功能
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications?.emailNotifications ?? true}
                        onCheckedChange={(checked) =>
                          updateNotifications('emailNotifications', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>簡訊通知</Label>
                        <p className="text-sm text-muted-foreground">
                          啟用簡訊通知功能
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications?.smsNotifications ?? false}
                        onCheckedChange={(checked) =>
                          updateNotifications('smsNotifications', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>預約確認通知</Label>
                        <p className="text-sm text-muted-foreground">
                          預約建立時發送確認通知
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications?.bookingConfirmation ?? true}
                        onCheckedChange={(checked) =>
                          updateNotifications('bookingConfirmation', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>預約提醒</Label>
                        <p className="text-sm text-muted-foreground">
                          預約前發送提醒通知
                        </p>
                      </div>
                      <Switch
                        checked={settings.notifications?.bookingReminder ?? true}
                        onCheckedChange={(checked) =>
                          updateNotifications('bookingReminder', checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {settings.notifications?.bookingReminder && (
                  <div className="space-y-2">
                    <Label htmlFor="reminderHoursBefore">提醒時間（小時前）</Label>
                    <Input
                      id="reminderHoursBefore"
                      type="number"
                      value={settings.notifications?.reminderHoursBefore || 24}
                      onChange={(e) =>
                        updateNotifications('reminderHoursBefore', parseInt(e.target.value))
                      }
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      在預約前多久發送提醒
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
