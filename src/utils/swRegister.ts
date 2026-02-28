/**
 * Service Worker 注册模块
 * 处理 PWA 离线缓存和后台功能
 */

// 检查是否需要显示更新提示
let updateCallback: (() => void) | null = null;

export function onSWUpdate(callback: () => void) {
  updateCallback = callback;
}

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration.scope);

          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 有新版本可用
                console.log('[SW] New version available');
                if (updateCallback) {
                  updateCallback();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });

      // 监听来自 SW 的消息
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-click') {
          // 处理通知点击
          console.log('[SW] Notification clicked:', event.data);
        }
      });
    });
  } else {
    console.log('[SW] Service Worker not supported');
  }
}

/**
 * 检查当前是否在线
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('[Notification] Not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * 显示本地通知
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // 如果页面在后台，使用 Service Worker 发送通知
  if (document.visibilityState === 'hidden' && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192-maskable.png',
        ...options,
      });
    });
  } else {
    // 页面在前台，使用普通通知
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      ...options,
    });
  }
}

/**
 * 订阅推送通知（需要后端支持）
 */
export async function subscribePushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[Push] Not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (!permission) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(
      'BEl62iSMfDjL0p1j8_5r9-Dk5W3h8h8h8h8h8h8h8h8h8h8h8h8h8h8h8h8h8' // 需要替换为实际的 VAPID 公钥
    );
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as any,
    });
    console.log('[Push] Subscribed:', subscription);
    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * 将 base64 URL 安全的字符串转换为 Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
