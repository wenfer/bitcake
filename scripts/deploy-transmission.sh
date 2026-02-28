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
    local download_url="https://github.com/${REPO}/releases/download/${version}/bitcake-transmission.zip"
    local temp_file="/tmp/bitcake-transmission-${version}.zip"
    
    print_info "正在下载 BitCake ${version}..."
    
    if ! curl -L -o "${temp_file}" "${download_url}"; then
        print_error "下载失败"
        exit 1
    fi
    
    echo "${temp_file}"
}

# 查找 Transmission WebUI 目录
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
    
    # 输出结果（只输出目录路径，不要有其他信息）
    echo "$result"
}

# 备份现有 WebUI
backup_webui() {
    local web_dir="$1"
    local backup_dir="${web_dir}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -d "$web_dir" ] && [ "$(ls -A "$web_dir" 2>/dev/null)" ]; then
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
    
    # 清空目标目录
    if [ -d "$target_dir" ]; then
        print_info "清空现有目录内容..."
        rm -rf "${target_dir:?}/"*
    else
        print_info "创建目录..."
        mkdir -p "$target_dir"
    fi
    
    # 解压文件
    print_info "解压文件..."
    unzip -q "$zip_file" -d "$target_dir"
    
    # 设置权限
    chmod -R 755 "$target_dir"
    
    print_success "部署完成"
}

# 主函数
main() {
    local install_dir=""
    local latest_version=""
    local temp_file=""
    local backup_dir=""
    
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
            print_info "常见目录位置:"
            print_info "  - Transmission 4.0+: /usr/share/transmission/public_html"
            print_info "  - Transmission 3.x:  /usr/share/transmission/web"
            print_info "  - 手动安装:          /usr/local/share/transmission/public_html"
            print_info ""
            print_info "请手动输入 Transmission WebUI 目录:"
            read -r user_input
            if [ -n "$user_input" ]; then
                install_dir="$user_input"
            else
                print_error "未提供有效目录"
                exit 1
            fi
        else
            print_info "找到 WebUI 目录: ${install_dir}"
        fi
    fi
    
    # 确认是否继续
    if [ -d "$install_dir" ]; then
        print_warning "目录已存在: ${install_dir}"
        print_info "该目录的内容将被清空并替换为 BitCake"
    else
        print_info "将创建新目录: ${install_dir}"
    fi
    
    read -p "是否继续? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_info "已取消"
        exit 0
    fi
    
    # 创建目录（如果不存在）
    if [ ! -d "$install_dir" ]; then
        print_info "创建目录..."
        mkdir -p "$install_dir" || {
            print_error "无法创建目录: $install_dir"
            print_info "请使用 sudo 运行脚本"
            exit 1
        }
    fi
    
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
    
    # 备份
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
    
    print_info ""
    print_info "请刷新 Transmission WebUI 查看效果"
    print_info "如果出现问题，可以通过备份恢复:"
    print_info "  sudo rm -rf ${install_dir}"
    print_info "  sudo cp -r ${backup_dir} ${install_dir}"
}

# 运行主函数
main "$@"
