import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Mail,
  Webhook,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  TestTube,
  Save,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type SettingsTab = 'general' | 'users' | 'notifications' | 'security' | 'internationalization';

interface NotificationChannel {
  id: string;
  name: string;
  channel: 'email' | 'webhook' | 'wechat' | 'dingtalk';
  enabled: boolean;
  config: Record<string, any>;
}

const channelIcons: Record<string, any> = {
  email: Mail,
  webhook: Webhook,
  wechat: MessageSquare,
  dingtalk: MessageSquare,
};

const channelColors: Record<string, string> = {
  email: 'text-blue-400 bg-blue-500/10',
  webhook: 'text-purple-400 bg-purple-500/10',
  wechat: 'text-green-400 bg-green-500/10',
  dingtalk: 'text-orange-400 bg-orange-500/10',
};

const tabs = [
  { id: 'general' as SettingsTab, labelKey: 'settings.tabs.general', icon: SettingsIcon },
  { id: 'users' as SettingsTab, labelKey: 'settings.tabs.users', icon: User },
  { id: 'notifications' as SettingsTab, labelKey: 'settings.tabs.notifications', icon: Bell },
  { id: 'security' as SettingsTab, labelKey: 'settings.tabs.security', icon: Shield },
  { id: 'internationalization' as SettingsTab, labelKey: 'settings.tabs.language', icon: Globe },
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [editingChannel, setEditingChannel] = useState<string | null>(null);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  // Fetch notification channels
  const { data: channels } = useQuery({
    queryKey: ['notifications', 'channels'],
    queryFn: async () => {
      return await api.get('/notifications/channels') as NotificationChannel[];
    },
    enabled: activeTab === 'notifications',
  });

  // Toggle channel mutation
  const toggleChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await api.patch(`/notifications/channels/${channelId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'channels'] });
    },
  });

  // Test channel mutation
  const testChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await api.post(`/notifications/channels/${channelId}/test`);
    },
  });

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('settings.generalSettings')}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {t('settings.platformName')}
          </label>
          <Input
            type="text"
            defaultValue="React Monitor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {t('settings.refreshInterval')}
          </label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="1">1 {t('settings.second')}</option>
            <option value="3">3 {t('settings.seconds')}</option>
            <option value="5" selected>5 {t('settings.seconds')}</option>
            <option value="10">10 {t('settings.seconds')}</option>
            <option value="30">30 {t('settings.seconds')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {t('settings.dataRetention')}
          </label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="7">7 {t('settings.days')}</option>
            <option value="30" selected>30 {t('settings.days')}</option>
            <option value="90">90 {t('settings.days')}</option>
            <option value="365">1 {t('settings.year')}</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">{t('settings.realtimeUpdates')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.receiveRealtimeDesc')}</p>
          </div>
          <button className="text-green-400">
            <ToggleRight className="w-8 h-8" />
          </button>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />
          {t('settings.saveChanges')}
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t('settings.notificationChannels')}</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          {t('settings.addChannel')}
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('settings.configureChannelsDesc')}
      </p>

      <div className="space-y-4">
        {channels?.map((channel) => {
          const Icon = channelIcons[channel.channel] || Bell;
          const colorClass = channelColors[channel.channel] || 'text-muted-foreground bg-gray-500/10';

          return (
            <div
              key={channel.id}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn('p-3 rounded-lg', colorClass)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{channel.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{channel.channel}</p>
                    
                    {/* Channel config preview */}
                    <div className="mt-3 space-y-1">
                      {channel.channel === 'email' && (
                        <>
                          <p className="text-xs text-muted-foreground">SMTP: {channel.config.smtpHost}:{channel.config.smtpPort}</p>
                          <p className="text-xs text-muted-foreground">To: {channel.config.to?.join(', ')}</p>
                        </>
                      )}
                      {channel.channel === 'webhook' && (
                        <p className="text-xs text-muted-foreground">URL: {channel.config.url}</p>
                      )}
                      {channel.channel === 'wechat' && (
                        <p className="text-xs text-muted-foreground">Webhook: {channel.config.webhookUrl?.substring(0, 50)}...</p>
                      )}
                      {channel.channel === 'dingtalk' && (
                        <p className="text-xs text-muted-foreground">Webhook: {channel.config.webhookUrl?.substring(0, 50)}...</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => testChannelMutation.mutate(channel.id)}
                    disabled={testChannelMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                  >
                    <TestTube className="w-3.5 h-3.5" />
                    {t('settings.test')}
                  </button>

                  <button
                    onClick={() => setEditingChannel(editingChannel === channel.id ? null : channel.id)}
                    className="p-2 rounded-lg hover:bg-dark-700 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => toggleChannelMutation.mutate(channel.id)}
                    className="flex items-center gap-2"
                  >
                    {channel.enabled ? (
                      <ToggleRight className="w-8 h-8 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {editingChannel === channel.id && (
                <div className="mt-6 pt-6 border-t border-dark-600 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      {t('settings.channelName')}
                    </label>
                    <Input
                      type="text"
                      defaultValue={channel.name}
                    />
                  </div>

                  {channel.channel === 'email' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            {t('settings.smtpHost')}
                          </label>
                          <Input
                            type="text"
                            defaultValue={channel.config.smtpHost}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            {t('settings.smtpPort')}
                          </label>
                          <Input
                            type="number"
                            defaultValue={channel.config.smtpPort}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          {t('settings.recipientsHint')}
                        </label>
                        <Input
                          type="text"
                          defaultValue={channel.config.to?.join(', ')}
                        />
                      </div>
                    </>
                  )}

                  {channel.channel === 'webhook' && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        {t('settings.webhookUrl')}
                      </label>
                      <Input
                        type="url"
                        defaultValue={channel.config.url}
                      />
                    </div>
                  )}

                  {(channel.channel === 'wechat' || channel.channel === 'dingtalk') && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        {t('settings.webhookUrl')}
                      </label>
                      <Input
                        type="url"
                        defaultValue={channel.config.webhookUrl}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
                      <Save className="w-4 h-4" />
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => setEditingChannel(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-muted-foreground rounded-lg text-sm font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t('settings.userManagement')}</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-primary-foreground rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          {t('settings.addUser')}
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('settings.user')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('common.email')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('settings.role')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('common.status')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {[
                { id: '1', username: 'admin', email: 'admin@example.com', role: 'admin', status: 'active' },
                { id: '2', username: 'operator1', email: 'op1@example.com', role: 'operator', status: 'active' },
                { id: '3', username: 'developer1', email: 'dev1@example.com', role: 'developer', status: 'active' },
                { id: '4', username: 'guest', email: 'guest@example.com', role: 'guest', status: 'inactive' },
              ].map((user) => (
                <tr key={user.id} className="hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-400">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      user.role === 'admin' && 'bg-purple-500/10 text-purple-400',
                      user.role === 'operator' && 'bg-blue-500/10 text-blue-400',
                      user.role === 'developer' && 'bg-green-500/10 text-green-400',
                      user.role === 'guest' && 'bg-gray-500/10 text-muted-foreground'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      user.status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-dark-600 text-muted-foreground hover:text-foreground transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('settings.language')}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {t('settings.selectLanguage')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => changeLanguage('zh')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                i18n.language === 'zh'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 bg-dark-800 hover:border-dark-500'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <span className="text-lg">🇨🇳</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">简体中文</p>
                <p className="text-xs text-muted-foreground">Chinese (Simplified)</p>
              </div>
              {i18n.language === 'zh' && (
                <Check className="w-5 h-5 text-primary-400 ml-auto" />
              )}
            </button>
            
            <button
              onClick={() => changeLanguage('en')}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                i18n.language === 'en'
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 bg-dark-800 hover:border-dark-500'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="text-lg">🇺🇸</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">English</p>
                <p className="text-xs text-muted-foreground">English (US)</p>
              </div>
              {i18n.language === 'en' && (
                <Check className="w-5 h-5 text-primary-400 ml-auto" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 bg-dark-800 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t('settings.languageNote')}
          </p>
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (title: string) => (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-dark-700 rounded-2xl mb-4">
        <SettingsIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        {t('settings.configureDesc', { title: title.toLowerCase() })}
      </p>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'users':
        return renderUserManagement();
      case 'security':
        return renderPlaceholder(t('settings.securitySettings'));
      case 'internationalization':
        return renderLanguageSettings();
      default:
        return renderPlaceholder(t('settings.title'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('settings.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Settings layout */}
      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-dark-700'
                )}
              >
                <Icon className="w-5 h-5" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 glass rounded-xl p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
