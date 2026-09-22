import { ref, onMounted, onUnmounted } from 'vue';
import { showNotification, requestNotificationPermission, isOnline } from '@/utils/swRegister';
import { useI18n } from 'vue-i18n';

export interface NotificationState {
  enabled: boolean;
  offline: boolean;
  supported: boolean;
}

export const NOTIFICATION_STORAGE_KEY = 'desktop_notification_enabled';

const notificationState = ref<NotificationState>({
  enabled: false,
  offline: false,
  supported: false,
});

// 已通知过的任务 ID 集合（避免重复通知）
const notifiedTasks = new Set<string>();

export function useNotifications() {
  const { t } = useI18n();

  // 检查浏览器是否支持通知
  const isNotificationSupported = (): boolean => {
    return 'Notification' in window && 'serviceWorker' in navigator;
  };

  // 检查通知权限状态
  const checkNotificationStatus = async () => {
    if (!isNotificationSupported()) {
      notificationState.value.supported = false;
      notificationState.value.enabled = false;
      return;
    }
    notificationState.value.supported = true;
    const userPref = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const hasPermission = Notification.permission === 'granted';
    notificationState.value.enabled = hasPermission && userPref !== 'false';
  };

  // 启用通知
  const enableNotifications = async (): Promise<boolean> => {
    if (!isNotificationSupported()) {
      return false;
    }
    const granted = await requestNotificationPermission();
    if (granted) {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
      notificationState.value.enabled = true;
      return true;
    } else {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
      notificationState.value.enabled = false;
      return false;
    }
  };

  // 关闭通知
  const disableNotifications = (): void => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'false');
    notificationState.value.enabled = false;
  };

  // 切换通知状态
  const toggleNotifications = async (): Promise<boolean> => {
    if (notificationState.value.enabled) {
      disableNotifications();
      return false;
    }
    return await enableNotifications();
  };

  // 显示种子完成通知
  const notifyTorrentCompleted = (torrentName: string) => {
    if (!notificationState.value.enabled) return;
    const taskId = `completed:${torrentName}`;
    if (notifiedTasks.has(taskId)) return;
    notifiedTasks.add(taskId);

    showNotification(t('notification.torrentCompleted'), {
      body: torrentName,
      tag: taskId,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192-maskable.png',
      requireInteraction: false,
      data: { type: 'torrent-completed', name: torrentName },
    });
  };

  // 显示种子出错通知
  const notifyTorrentError = (torrentName: string, errorMessage: string) => {
    if (!notificationState.value.enabled) return;
    const taskId = `error:${torrentName}`;
    if (notifiedTasks.has(taskId)) return;
    notifiedTasks.add(taskId);

    showNotification(t('notification.torrentError'), {
      body: `${torrentName}: ${errorMessage}`,
      tag: taskId,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192-maskable.png',
      requireInteraction: true,
      data: { type: 'torrent-error', name: torrentName, error: errorMessage },
    });
  };

  // 显示校验完成通知
  const notifyCheckCompleted = (torrentName: string) => {
    if (!notificationState.value.enabled) return;
    const taskId = `check:${torrentName}`;
    if (notifiedTasks.has(taskId)) return;
    notifiedTasks.add(taskId);

    showNotification(t('notification.checkCompleted'), {
      body: torrentName,
      tag: taskId,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192-maskable.png',
      requireInteraction: false,
      data: { type: 'check-completed', name: torrentName },
    });
  };

  // 显示离线/在线状态变化通知
  const notifyConnectionStatus = (online: boolean) => {
    const wasOffline = notificationState.value.offline;
    notificationState.value.offline = !online;

    if (!notificationState.value.enabled) return;

    // 只在状态变化时通知
    if (wasOffline && online) {
      showNotification(t('notification.backOnline'), {
        body: t('notification.connectionRestored'),
        tag: 'connection-status',
        icon: '/icons/icon-192x192.png',
        requireInteraction: false,
      });
    } else if (!wasOffline && !online) {
      showNotification(t('notification.offline'), {
        body: t('notification.offlineMessage'),
        tag: 'connection-status',
        icon: '/icons/icon-192x192.png',
        requireInteraction: false,
      });
    }
  };

  // 监听网络状态
  const handleOnline = () => notifyConnectionStatus(true);
  const handleOffline = () => notifyConnectionStatus(false);
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === NOTIFICATION_STORAGE_KEY) {
      checkNotificationStatus();
    }
  };

  onMounted(() => {
    checkNotificationStatus();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageChange);
    notificationState.value.offline = !isOnline();
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('storage', handleStorageChange);
  });

  return {
    notificationState,
    enableNotifications,
    disableNotifications,
    toggleNotifications,
    notifyTorrentCompleted,
    notifyTorrentError,
    notifyCheckCompleted,
    checkNotificationStatus,
  };
}
