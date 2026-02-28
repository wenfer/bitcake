/// <reference lib="webworker" />

const CACHE_NAME = 'bitcake-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './cake.svg',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-192x192-maskable.png',
  './icons/icon-512x512-maskable.png',
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求使用网络优先策略
  if (url.pathname.includes('/transmission/rpc') || url.pathname.includes('/api/v2')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 网络请求成功，返回响应
          return response;
        })
        .catch(() => {
          // 网络失败，返回离线提示
          return new Response(
            JSON.stringify({
              error: 'offline',
              message: 'You are offline. Please check your network connection.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 静态资源使用缓存优先策略
  event.respondWith(
    caches.match(request).then((cached) => {
      // 返回缓存或发起网络请求
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // 更新缓存
          if (networkResponse.ok && request.method === 'GET') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // 网络失败，如果缓存中有就返回缓存
          return cached;
        });

      return cached || fetchPromise;
    })
  );
});

// 处理推送通知
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192-maskable.png',
    tag: data.tag || 'bitcake-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BitCake', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // 如果已有窗口打开，聚焦它
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // 发送消息给客户端
          client.postMessage({
            type: 'notification-click',
            action,
            data: notificationData,
          });
          return;
        }
      }
      // 否则打开新窗口
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// 处理后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'bitcake-sync') {
    event.waitUntil(
      // 可以在这里执行后台同步任务
      console.log('[SW] Background sync triggered')
    );
  }
});
