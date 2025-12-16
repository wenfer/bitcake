> 专门针对 pt 玩家优化的下载器 webui - 优先支持 transmission - 理论上兼容 qbittorrent

> 项目目前处于开荒阶段，更新可能会比较频繁，请见谅

> 界面已经更新，预览图已过期，建议自行安装查看效果

# 说明 (这部分是人工编写的)

由于找不到比较趁手的 ui 界面，就用 ai 生成撸了一个，以下说明 90%以上是 ai 生成的，但是信息足够新手起步了

原则上来说，是不应该重复造轮子的，但是 ai 生成成本太低了，也顺带着学习了下如何使用 ai 生成

有的人不会更换 webui，我使用 transmission-4.0.5 的官方镜像，重新构建了镜像，需要的自己参考下方，如果不喜欢 4.0.5，就自己替换 webui

对了，public 目录下有个 trackerSites.json，配置了 tracker 和站点名称的映射，用于把网址显示成站点名称，方便统计的时候查看数据

我只配置了我有的一些站，欢迎补充

# BitCake 🍰

A modern, unified web interface for Transmission and qBittorrent.

一个现代化的、统一的 Transmission 和 qBittorrent Web 界面。

## ✨ 特性

- 🚀 基于 Vue 3 + TypeScript + Vite 构建
- 🎯 统一接口，同时支持 Transmission 和 qBittorrent
- 📱 响应式设计，完美支持移动端访问
- 🎨 使用 Element Plus 组件库，界面美观现代
- 📊 强大的数据统计与可视化功能
- 🔧 紧凑的布局设计，信息密度更高
- 🌍 支持中文界面

## 🚀 部署

### 使用预构建容器

```
# 用这个记得把webui的配置给取消，因为默认的ui就是当前ui
---
services:
  transmission:
    image: ghcr.io/wenfer/bitcake:latest
    container_name: transmission
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      - USER= #optional
      - PASS= #optional
      - WHITELIST= #optional
      - PEERPORT= #optional
      - HOST_WHITELIST= #optional
    volumes:
      - /path/to/transmission/data:/config
      - /path/to/downloads:/downloads #optional
      - /path/to/watch/folder:/watch #optional
    ports:
      - 9091:9091
      - 51413:51413
      - 51413:51413/udp
    restart: unless-stopped


```

### 部署到 Transmission

1. 从 release 下载 Transmission 客户端版本

2. 解压内容复制到容器目录

3. 通过 TRANSMISSION_WEB_HOME 环境变量更换 webui 界面

```yml
environment:
  - TRANSMISSION_WEB_HOME=/path/to/webui #UI所在路径
```

### 部署到 qBittorrent

1. 从 release 下载 QBittorrent 客户端版本

2. 将目录内容复制到自定义 WebUI 目录

3. 在 qBittorrent 设置中启用"使用替代 WebUI"，并指定目录路径

> 遇到修改后无法访问 qbit 的问题，可以请求此接口恢复自带 ui

```bash
{你的qb地址}/api/v2/app/setPreferences?json=%7B"alternative_webui_enabled":false%7D
```

### 使用说明

**登录认证**：

- **qBittorrent**: 必须提供用户名和密码（使用 qBittorrent 设置的凭据）
- **Transmission**: 如果 Transmission 启用了认证，需要提供凭据；否则可留空

**退出登录**：

- 点击右上角的退出按钮即可注销

## 🔧 环境变量

- `VITE_TORRENT_BACKEND`: 指定后端类型，可选值 `transmission` 或 `qbittorrent`
- `VITE_TORRENT_API_BASE`: 自定义 API 基础路径
- `VITE_PROXY_TRANSMISSION_URL`: Transmission 代理地址（开发用）
- `VITE_PROXY_QB_URL`: qBittorrent 代理地址（开发用）

## 📊 主要功能

- ✅ 种子列表管理（添加、删除、启动、暂停）
- ✅ 种子详情查看（文件列表、Tracker、Peers）
- ✅ 批量操作（批量限速、批量删除）
- ✅ 高级筛选（按状态、Tracker、关键词）
- ✅ 数据统计与可视化图表
- ✅ 全局设置管理（下载、速度、连接、队列等）
- ✅ 实时数据刷新
- ✅ 紧凑的界面设计

## 📝 版本信息

- 后端版本、RPC 速率与磁盘空间显示在顶部导航栏
- WebUI 版本号在 `package.json` 中维护

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [ECharts](https://echarts.apache.org/) - 数据可视化图表库
- [Transmission](https://transmissionbt.com/) - 轻量级 BT 客户端
- [qBittorrent](https://www.qbittorrent.org/) - 开源 BT 客户端

## 预览

![首页](preview/index.png)
![数据统计](preview/stat1.png)
![统计](preview/stat2.png)

## 📄 License

MIT License
