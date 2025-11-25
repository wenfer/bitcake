# Transmission Vue WebUI

Vue 3 + TypeScript + Vite implementation of a Transmission Web UI. It keeps the RPC experience lightweight while offering richer tables and dialogs than the default UI.

## 开发

基本是纯ai生成的


```bash
npm install
npm run dev
```

## 打包

```bash
npm run build
```

The build emits static assets into `dist/` using relative paths so they can be copied directly into Transmission's web directory (or any HTTP server).

## 内置到 Transmission

1. `npm run build` 生成 `dist/`。
2. 将 `dist` 内容复制到 Transmission Web UI 目录，例如：
   - Linux: `/usr/share/transmission/web/`
   - macOS: `/Applications/Transmission.app/Contents/Resources/web/`
3. 或者在 `settings.json` 设置 `web-home` 指向你拷贝的目录。
4. 重启 Transmission，以浏览器打开 Transmission 的 Web UI 即使用新的前端。

## 版本信息

- Transmission 版本、RPC 速率与磁盘空间显示在顶部导航栏。
- WebUI 自身版本号与数据更新时间也显示在顶部，可在 `package.json` 中维护版本后重新打包。
