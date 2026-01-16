# BitCake 🍰

[中文](./README.md) | **English**

> A web UI optimized specifically for PT players - Priority support for Transmission - Theoretically compatible with qBittorrent

> Thanks to jackloves111 for joining and contributing

## 📖 Overview

BitCake is a modern, unified web interface for Transmission and qBittorrent, designed with PT (Private Tracker) users in mind. It provides a clean, efficient, and feature-rich interface for managing your torrents.

## ✨ Features

- 🚀 Built with Vue 3 + TypeScript + Vite
- 🎯 Unified interface supporting both Transmission and qBittorrent
- 📱 Responsive design with perfect mobile support
- 🎨 Modern UI powered by Element Plus
- 📊 Powerful statistics and data visualization
- 🔧 Compact layout with high information density
- 🌍 Multi-language support (Chinese & English)
- 🎨 Multiple theme options (Fresh Green, Simple Blue, Cute Pink)
- 🏷️ Advanced torrent management with labels and categories
- ⚡ Batch operations and speed limit strategies
- 📈 Real-time speed monitoring and tracker statistics
- 🔄 Reseed management for cross-seeding

## 🚀 Deployment

### Using Pre-built Container

The easiest way to get started is using the pre-built Docker image:

baseon transmission:4.0,5

```yaml
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

> Note: When using this image, the default UI is already BitCake, so you don't need to configure the WebUI path.

### Deploy to Transmission

1. Download the Transmission build from the [releases page](https://github.com/yourusername/bitcake/releases)

2. Extract and copy the contents to your container directory

3. Set the WebUI path using the `TRANSMISSION_WEB_HOME` environment variable:

```yaml
environment:
  - TRANSMISSION_WEB_HOME=/path/to/webui
```

### Deploy to qBittorrent

1. Download the qBittorrent build from the [releases page](https://github.com/yourusername/bitcake/releases)

2. Copy the directory contents to your custom WebUI directory

3. Enable "Use alternative WebUI" in qBittorrent settings and specify the directory path

> If you encounter access issues after modification, you can restore the default UI using this API call:

```bash
{your-qb-address}/api/v2/app/setPreferences?json=%7B"alternative_webui_enabled":false%7D
```

## 🔧 Configuration

### Tracker Sites Mapping

BitCake includes a `trackerSites.json` file in the `public` directory that maps tracker URLs to site names. This makes it easier to identify torrents by site name in statistics and lists.

The configuration supports internationalization with separate files for different languages:
- `trackerSites-zh-CN.json` - Chinese site names
- `trackerSites-en-US.json` - English site names

Feel free to contribute additional tracker mappings!

### Authentication

- **qBittorrent**: Username and password are required (use your qBittorrent credentials)
- **Transmission**: Credentials are required only if authentication is enabled; otherwise, leave blank

### Logout

Click the logout button in the top-right corner to sign out.

## 💻 Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Environment Variables

Create a `.env` file in the project root:

```bash
# Backend type: 'transmission' or 'qbittorrent'
VITE_TORRENT_BACKEND=transmission

# Custom API base path (optional)
VITE_TORRENT_API_BASE=/transmission/rpc

# Development proxy URLs (optional)
VITE_PROXY_TRANSMISSION_URL=http://localhost:9091
VITE_PROXY_QB_URL=http://localhost:8080
```

### Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for Transmission
npm run build:transmission

# Build for qBittorrent
npm run build:qbittorrent

# Build for production (generic)
npm run build
```

## 🎨 Screenshots

![Home Page](preview/index.png)
*Main torrent list with advanced filtering*

![Statistics](preview/stat1.png)
*Comprehensive statistics and charts*

![Batch Operations](preview/stat2.png)
*Batch speed limit management*

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - Progressive JavaScript Framework
- [Element Plus](https://element-plus.org/) - Vue 3 Component Library
- [ECharts](https://echarts.apache.org/) - Data Visualization Library
- [Transmission](https://transmissionbt.com/) - Lightweight BitTorrent Client
- [qBittorrent](https://www.qbittorrent.org/) - Open Source BitTorrent Client

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

---

Made with ❤️ for PT enthusiasts
