import { ref, onMounted, onUnmounted } from 'vue';
import { showNotification, requestNotificationPermission, isOnline } from '@/utils/swRegister';
import { useI18n } from 'vue-i18n';

export interface NotificationState {
  enabled: boolean;
  offline: boolean;
}

const notificationState = ref<NotificationState>({
  enabled: false,
  offline: false,
});

// 已通知过的任务 ID 集合（避免重复通知）
const notifiedTasks = new Set<string>();

export function useNotifications() {
  const { t } = useI18n();

  // 检查通知权限状态
  const checkNotificationStatus = async () => {
    if (!('Notification' in window)) {
      notificationState.value.enabled = false;
      return;
    }
    notificationState.value.enabled = Notification.permission === 'granted';
  };

  // 启用通知
  const enableNotifications = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    notificationState.value.enabled = granted;
    return granted;
  };

  // 显示种子完成通知
  const notifyTorrentCompleted = (torrentName: string) => {
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

  onMounted(() => {
    checkNotificationStatus();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    notificationState.value.offline = !isOnline();
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  });

  return {
    notificationState,
    enableNotifications,
    notifyTorrentCompleted,
    notifyTorrentError,
    notifyCheckCompleted,
    checkNotificationStatus,
  };
}
