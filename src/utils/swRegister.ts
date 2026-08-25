/** 注册离线缓存 Service Worker。 */
export function registerSW() {
  if (!('serviceWorker' in navigator)) return

  const register = async () => {
    try {
      await navigator.serviceWorker.register('./sw.js')
    } catch (error) {
      console.error('[SW] Registration failed:', error)
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('load', () => void register(), { once: true })
  } else {
    void register()
  }
}

export function isOnline(): boolean {
  return navigator.onLine
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  return (await Notification.requestPermission()) === 'granted'
}

export function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  if (
    document.visibilityState === 'hidden' &&
    'serviceWorker' in navigator &&
    navigator.serviceWorker.controller
  ) {
    void navigator.serviceWorker.ready.then((registration) =>
      registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192-maskable.png',
        ...options,
      })
    )
    return
  }

  new Notification(title, {
    icon: '/icons/icon-192x192.png',
    ...options,
  })
}
