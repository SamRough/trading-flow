#!/bin/bash

# 股票交易流程可视化系统 - 启动服务器脚本

echo "==================================="
echo "股票交易流程可视化系统"
echo "==================================="
echo ""

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "错误: 未找到Python，请先安装Python 3.x"
    exit 1
fi

echo "使用: $PYTHON_CMD"
echo ""
echo "正在启动HTTP服务器..."
echo "==================================="
echo ""
echo "请访问以下地址查看系统："
echo "  • 主程序: http://localhost:8000"
echo "  • 功能测试: http://localhost:8000/test.html"
echo "  • 使用说明: http://localhost:8000/README.md"
echo ""
echo "快捷键："
echo "  • Ctrl+C 停止服务器"
echo "==================================="
echo ""

# 启动服务器
$PYTHON_CMD -m http.server 8000
