/**
 * PWA 快捷操作（Shortcuts）配置
 * 用户长按应用图标时显示的快捷菜单
 */
export const pwaShortcuts = [
  {
    name: '添加种子',
    short_name: '添加',
    description: '快速添加新的种子',
    url: '/?action=add-torrent',
    icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
  },
  {
    name: '暂停所有',
    short_name: '暂停',
    description: '暂停所有正在运行的种子',
    url: '/?action=pause-all',
    icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
  },
  {
    name: '开始所有',
    short_name: '开始',
    description: '开始所有已暂停的种子',
    url: '/?action=start-all',
    icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
  },
  {
    name: '查看统计',
    short_name: '统计',
    description: '查看下载统计信息',
    url: '/stats',
    icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
  },
];

/**
 * 处理 PWA 快捷操作
 */
export function handlePwaShortcut(action: string): void {
  switch (action) {
    case 'add-torrent':
      // 触发添加种子对话框
      window.dispatchEvent(new CustomEvent('pwa:open-add-dialog'));
      break;
    case 'pause-all':
      window.dispatchEvent(new CustomEvent('pwa:pause-all'));
      break;
    case 'start-all':
      window.dispatchEvent(new CustomEvent('pwa:start-all'));
      break;
    default:
      console.log('[PWA] Unknown shortcut action:', action);
  }
}

/**
 * 检查当前是否以 PWA 模式运行
 */
export function isPwaMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * 检查是否支持作为分享目标
 */
export function canReceiveShare(): boolean {
  return 'share' in navigator;
}

/**
 * 处理分享的磁力链接
 */
export async function handleSharedMagnet(magnetLink: string): Promise<void> {
  if (!magnetLink || !magnetLink.startsWith('magnet:')) {
    console.warn('[PWA] Invalid magnet link:', magnetLink);
    return;
  }

  // 触发添加种子事件，传递磁力链接
  window.dispatchEvent(
    new CustomEvent('pwa:shared-magnet', {
      detail: { magnetLink },
    })
  );
}

/**
 * 注册 PWA 相关事件监听
 */
export function registerPwaEvents(): void {
  // 监听 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', (e) => {
    // 保存事件以便稍后触发
    (window as any).deferredPrompt = e;
    console.log('[PWA] App can be installed');
  });

  // 监听 appinstalled 事件
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed');
    (window as any).deferredPrompt = null;
  });

  // 处理 URL 参数中的快捷操作
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  if (action) {
    handlePwaShortcut(action);
  }
}

/**
 * 触发安装提示
 */
export async function promptInstall(): Promise<boolean> {
  const deferredPrompt = (window as any).deferredPrompt;
  
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  (window as any).deferredPrompt = null;
  
  return outcome === 'accepted';
}
