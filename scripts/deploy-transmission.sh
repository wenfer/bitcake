#!/bin/bash
#
# BitCake 部署脚本 for Transmission
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

# 打印带颜色的消息（全部输出到 stderr，避免污染函数返回值）
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 获取最新版本号（只输出版本号到 stdout）
get_latest_version() {
    local api_url="https://api.github.com/repos/${REPO}/releases/latest"
    local version=""
    
    # 尝试获取，带重试机制
    for i in 1 2 3; do
        version=$(curl -sL "${api_url}" 2>/dev/null | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        if [ -n "$version" ]; then
            break
        fi
        sleep 1
    done
    
    # 如果 API 失败，尝试直接访问 latest release 页面
    if [ -z "$version" ]; then
        version=$(curl -sL "https://github.com/${REPO}/releases/latest" 2>/dev/null | grep -o 'tag/[^"]*' | head -1 | sed 's/tag\///')
    fi
    
    echo "$version"
}

# 下载 BitCake（只输出文件路径到 stdout）
download_bitcake() {
    local version="$1"
    # 从 tag 中提取版本号（去掉 commit hash）
    local pkg_version=$(echo "$version" | sed -E 's/-[a-f0-9]+$//')
    local download_url="https://github.com/${REPO}/releases/download/${version}/bitcake-${pkg_version}-transmission.zip"
    local temp_file="/tmp/bitcake-transmission-${version}.zip"
    
    print_info "正在下载 BitCake ${version}..."
    print_info "下载地址: ${download_url}"
    
    if ! curl -fsSL -o "${temp_file}" "${download_url}" 2>/dev/null; then
        print_error "下载失败: ${download_url}"
        exit 1
    fi
    
    print_info "下载完成: ${temp_file}"
    echo "${temp_file}"
}

# 查找 Transmission WebUI 目录（只输出目录路径到 stdout）
find_transmission_web_dir() {
    local result=""
    
    # 如果设置了 TRANSMISSION_WEB_HOME，优先使用
    if [ -n "$TRANSMISSION_WEB_HOME" ]; then
        if [ -d "$TRANSMISSION_WEB_HOME" ]; then
            result="$TRANSMISSION_WEB_HOME"
        fi
    fi
    
    # 尝试从 transmission-daemon 进程查找
    if [ -z "$result" ]; then
        local daemon_path
        daemon_path=$(which transmission-daemon 2>/dev/null || echo "")
        if [ -n "$daemon_path" ]; then
            local real_path
            real_path=$(readlink -f "$daemon_path")
            local base_dir
            base_dir=$(dirname "$(dirname "$real_path")")
            
            # 优先检查 public_html (Transmission 4.0+)
            if [ -d "${base_dir}/share/transmission/public_html" ]; then
                result="${base_dir}/share/transmission/public_html"
            elif [ -d "${base_dir}/share/transmission/web" ]; then
                result="${base_dir}/share/transmission/web"
            fi
        fi
    fi
    
    # 检查常见路径
    if [ -z "$result" ]; then
        local possible_dirs=(
            "/usr/share/transmission/public_html"
            "/usr/share/transmission/web"
            "/usr/local/share/transmission/public_html"
            "/usr/local/share/transmission/web"
            "/var/lib/transmission-daemon/public_html"
            "/var/lib/transmission-daemon/web"
            "/opt/transmission/public_html"
            "/opt/transmission/web"
        )
        
        for dir in "${possible_dirs[@]}"; do
            if [ -d "$dir" ]; then
                result="$dir"
                break
            fi
        done
    fi
    
    echo "$result"
}

# 主函数
main() {
    local install_dir=""
    local latest_version=""
    local temp_file=""
    
    print_info "BitCake for Transmission 部署脚本"
    print_info "=================================="
    
    # 检查依赖
    check_command curl
    check_command unzip
    
    # 如果提供了参数，直接使用参数作为目标目录
    if [ $# -gt 0 ]; then
        install_dir="$1"
        print_info "使用命令行指定的目录: ${install_dir}"
    else
        # 没有参数，尝试自动查找
        print_info "查找 Transmission WebUI 目录..."
        install_dir=$(find_transmission_web_dir)
        
        if [ -z "$install_dir" ]; then
            print_warning "无法自动找到 Transmission WebUI 目录"
            print_info "使用默认目录: /usr/local/share/transmission/public_html"
            install_dir="/usr/local/share/transmission/public_html"
        else
            print_info "找到 WebUI 目录: ${install_dir}"
        fi
    fi
    
    # 检查目录是否存在且非空，非空则重命名
    if [ -d "$install_dir" ]; then
        if [ "$(ls -A "$install_dir" 2>/dev/null)" ]; then
            # 目录非空，重命名
            local backup_name="${install_dir}.backup.$(date +%Y%m%d_%H%M%S)"
            print_info "目录非空，重命名为: ${backup_name}"
            mv "$install_dir" "$backup_name"
        else
            # 目录为空，直接删除
            print_info "目录为空，删除..."
            rmdir "$install_dir"
        fi
    fi
    
    # 创建目录
    print_info "创建目录: ${install_dir}"
    mkdir -p "$install_dir"
    
    # 检查是否有写入权限
    if [ ! -w "$install_dir" ]; then
        print_error "没有写入权限: ${install_dir}"
        print_info "请使用 sudo 运行此脚本"
        exit 1
    fi
    
    # 获取最新版本
    print_info "检查最新版本..."
    latest_version=$(get_latest_version)
    
    if [ -z "$latest_version" ]; then
        print_error "无法获取最新版本信息"
        exit 1
    fi
    
    print_info "最新版本: ${latest_version}"
    
    # 下载
    temp_file=$(download_bitcake "$latest_version")
    
    # 部署
    print_info "部署 BitCake..."
    unzip -q "$temp_file" -d "$install_dir"
    chmod -R 755 "$install_dir"
    
    # 清理临时文件
    rm -f "$temp_file"
    
    # 输出结果
    print_success "BitCake ${latest_version} 部署成功！"
    print_info "安装目录: ${install_dir}"
    print_info ""
    print_info "请刷新 Transmission WebUI 查看效果"
}

# 运行主函数
main "$@"
