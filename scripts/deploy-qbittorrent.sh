#!/bin/bash
#
# BitCake 部署脚本 for qBittorrent
# 一键自动下载并部署 BitCake WebUI
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
REPO="wenfer/bitcake"
QBITTORRENT_CONFIG_DIR=""

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 获取最新版本号
get_latest_version() {
    curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
}

# 下载 BitCake
download_bitcake() {
    local version="$1"
    local download_url="https://github.com/${REPO}/releases/download/${version}/bitcake-qbittorrent.zip"
    local temp_file="/tmp/bitcake-qbittorrent-${version}.zip"
    
    print_info "正在下载 BitCake ${version}..."
    
    if ! curl -L -o "${temp_file}" "${download_url}"; then
        print_error "下载失败"
        exit 1
    fi
    
    echo "${temp_file}"
}

# 查找 qBittorrent 配置目录
find_qbittorrent_config_dir() {
    local possible_dirs=(
        "$HOME/.config/qBittorrent"
        "$HOME/.local/share/qBittorrent"
        "/var/lib/qbittorrent/.config/qBittorrent"
        "/opt/qbittorrent/config"
    )
    
    for dir in "${possible_dirs[@]}"; do
        if [ -d "$dir" ]; then
            echo "$dir"
            return 0
        fi
    done
    
    return 1
}

# 备份现有 WebUI
backup_webui() {
    local web_dir="$1"
    local backup_dir="${web_dir}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -d "$web_dir" ] && [ "$(ls -A "$web_dir")" ]; then
        print_info "备份现有 WebUI 到 ${backup_dir}..."
        cp -r "$web_dir" "$backup_dir"
        echo "$backup_dir"
    else
        echo ""
    fi
}

# 部署 BitCake
deploy_bitcake() {
    local zip_file="$1"
    local target_dir="$2"
    
    print_info "部署 BitCake 到 ${target_dir}..."
    
    # 创建目标目录
    if [ -d "$target_dir" ]; then
        rm -rf "${target_dir:?}/"*
    else
        mkdir -p "$target_dir"
    fi
    
    # 解压文件
    unzip -q "$zip_file" -d "$target_dir"
    
    # 设置权限
    chmod -R 755 "$target_dir"
    
    print_success "部署完成"
}

# 生成 qBittorrent 配置说明
print_config_instructions() {
    local webui_path="$1"
    
    print_info ""
    print_info "=================================="
    print_info "qBittorrent 配置说明"
    print_info "=================================="
    print_info ""
    print_info "请在 qBittorrent WebUI 中完成以下设置:"
    print_info ""
    print_info "1. 打开 qBittorrent WebUI"
    print_info "2. 进入 设置 → WebUI → 使用替代 WebUI"
    print_info "3. 勾选 '使用替代 WebUI'"
    print_info "4. 在 '文件路径' 中填写:"
    print_info "   ${webui_path}"
    print_info "5. 保存设置"
    print_info ""
    print_info "或者修改 qBittorrent 配置文件:"
    print_info "  编辑: ${QBITTORRENT_CONFIG_DIR}/qBittorrent.conf"
    print_info ""
    print_info "  添加或修改以下行:"
    print_info "  WebUI\\AlternativeUIEnabled=true"
    print_info "  WebUI\\RootFolder=${webui_path}"
    print_info ""
    print_warning "注意: 修改配置后需要重启 qBittorrent"
    print_info ""
    print_info "如果无法访问，可以通过 API 恢复默认 UI:"
    print_info "  curl \"http://localhost:8080/api/v2/app/setPreferences?json=%7B%22alternative_webui_enabled%22:false%7D\""
}

# 主函数
main() {
    local install_dir=""
    
    print_info "BitCake for qBittorrent 部署脚本"
    print_info "=================================="
    
    # 检查依赖
    check_command curl
    check_command unzip
    
    # 查找 qBittorrent 配置目录
    print_info "查找 qBittorrent 配置..."
    QBITTORRENT_CONFIG_DIR=$(find_qbittorrent_config_dir)
    
    if [ -n "$QBITTORRENT_CONFIG_DIR" ]; then
        print_info "找到配置目录: ${QBITTORRENT_CONFIG_DIR}"
        install_dir="${QBITTORRENT_CONFIG_DIR}/bitcake"
    else
        print_warning "无法自动找到 qBittorrent 配置目录"
        install_dir="$HOME/.config/qBittorrent/bitcake"
    fi
    
    # 如果提供了参数，使用参数作为目标目录
    if [ $# -gt 0 ]; then
        install_dir="$1"
        print_info "使用指定目录: ${install_dir}"
    fi
    
    # 确认安装目录
    print_info ""
    print_info "BitCake 将被安装到: ${install_dir}"
    read -p "是否继续? (y/N): " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_info "已取消"
        exit 0
    fi
    
    # 创建安装目录
    mkdir -p "$install_dir"
    
    # 检查是否有写入权限
    if [ ! -w "$install_dir" ]; then
        print_error "没有写入权限: ${install_dir}"
        print_info "请使用 sudo 运行此脚本，或选择其他目录"
        exit 1
    fi
    
    # 获取最新版本
    print_info "检查最新版本..."
    local latest_version
    latest_version=$(get_latest_version)
    
    if [ -z "$latest_version" ]; then
        print_error "无法获取最新版本信息"
        exit 1
    fi
    
    print_info "最新版本: ${latest_version}"
    
    # 下载
    local temp_file
    temp_file=$(download_bitcake "$latest_version")
    
    # 备份
    local backup_dir
    backup_dir=$(backup_webui "$install_dir")
    
    # 部署
    deploy_bitcake "$temp_file" "$install_dir"
    
    # 清理临时文件
    rm -f "$temp_file"
    
    # 输出结果
    print_success "BitCake ${latest_version} 部署成功！"
    print_info "安装目录: ${install_dir}"
    
    if [ -n "$backup_dir" ]; then
        print_info "备份目录: ${backup_dir}"
    fi
    
    # 输出配置说明
    print_config_instructions "$install_dir"
}

# 运行主函数
main "$@"
