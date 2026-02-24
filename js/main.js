// 主控制模块
class TradingFlowApp {
    constructor() {
        this.stateMachine = new OrderStateMachine();
        this.renderer = new VisualizationRenderer();
        this.currentOrder = null;
        this.currentScenario = null;
        this.isPlaying = false;
        this.playSpeed = 1.0;
        this.startTime = null;
        this.currentStepIndex = 0;
        this.stepTimer = null;

        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.initializeMermaid();
        this.initializeScenarios();
        this.updateUI();
    }

    setupEventListeners() {
        // 订单类型切换
        document.getElementById('orderType').addEventListener('change', (e) => {
            this.handleOrderTypeChange(e.target.value);
        });

        // 创建订单按钮
        document.getElementById('createOrderBtn').addEventListener('click', () => {
            this.createOrder();
        });

        // 场景选择
        document.getElementById('scenarioSelect').addEventListener('change', (e) => {
            this.loadScenario(e.target.value);
        });

        // 控制按钮
        document.getElementById('playBtn').addEventListener('click', () => {
            this.play();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pause();
        });

        document.getElementById('stepBtn').addEventListener('click', () => {
            this.step();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        // 速度选择
        document.getElementById('speedSelect').addEventListener('change', (e) => {
            this.setPlaySpeed(parseFloat(e.target.value));
        });

        // 表单输入验证
        const form = document.getElementById('orderForm');
        form.addEventListener('input', () => {
            this.validateForm();
        });
    }

    initializeMermaid() {
        // Mermaid 初始化现在由 VisualizationRenderer 处理
        // 这里只做标记，避免重复初始化
        window.mermaidInitialized = false;
    }

    initializeScenarios() {
        this.scenarios = ScenarioFactory.getAllScenarios();
        this.loadScenario('normal_buy');
    }

    handleOrderTypeChange(orderType) {
        const priceGroup = document.getElementById('priceGroup');
        const priceInput = document.getElementById('price');

        if (orderType === 'market') {
            priceGroup.style.display = 'none';
            priceInput.required = false;
        } else {
            priceGroup.style.display = 'block';
            priceInput.required = true;
        }
    }

    validateForm() {
        const stockCode = document.getElementById('stockCode').value.trim();
        const quantity = document.getElementById('quantity').value;
        const price = document.getElementById('price').value;
        const orderType = document.getElementById('orderType').value;

        const isValid = stockCode && quantity && (orderType === 'market' || price);

        document.getElementById('createOrderBtn').disabled = !isValid;

        return isValid;
    }

    createOrder() {
        if (!this.validateForm()) {
            this.showToast('请填写所有必填字段', 'warning');
            return;
        }

        const stockCode = document.getElementById('stockCode').value.trim();
        const orderType = document.getElementById('orderType').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const price = orderType === 'market' ? null : parseFloat(document.getElementById('price').value);

        // 创建订单
        this.currentOrder = new Order(stockCode, orderType, quantity, price);

        // 更新UI显示订单创建成功
        this.showToast('订单创建成功！', 'success');

        // 重置控制面板
        this.reset(true);

        // 初始渲染
        this.renderCurrentState();

        // 自动开始播放
        setTimeout(() => {
            this.play();
        }, 500);

        console.log('订单创建:', this.currentOrder);
    }

    loadScenario(scenarioName) {
        this.currentScenario = this.scenarios.find(s => s.name === scenarioName);

        if (this.currentScenario && this.currentOrder) {
            // 如果有现有订单，重新创建以应用新场景
            this.createOrder();
        }

        console.log('加载场景:', scenarioName);
    }

    play() {
        if (this.isPlaying) return;

        if (!this.currentOrder) {
            this.showToast('请先创建订单', 'warning');
            return;
        }

        this.isPlaying = true;
        this.startTime = Date.now();
        this.updateUI();

        if (this.currentStepIndex === 0) {
            // 开始执行场景
            this.executeScenario();
        } else {
            // 继续执行
            this.continueScenario();
        }

        console.log('开始播放');
    }

    pause() {
        this.isPlaying = false;
        this.updateUI();

        if (this.stepTimer) {
            clearTimeout(this.stepTimer);
            this.stepTimer = null;
        }

        console.log('暂停播放');
    }

    step() {
        if (!this.currentOrder) {
            this.showToast('请先创建订单', 'warning');
            return;
        }

        // 单步执行下一个状态变化
        this.isPlaying = true;
        this.executeNextStep();
        this.isPlaying = false;
        this.updateUI();

        console.log('单步执行');
    }

    reset(keepOrder = false) {
        this.isPlaying = false;
        this.currentStepIndex = 0;
        this.startTime = null;

        if (this.stepTimer) {
            clearTimeout(this.stepTimer);
            this.stepTimer = null;
        }

        if (!keepOrder && this.currentOrder) {
            this.currentOrder = null;
        }

        this.clearVisualization();
        this.updateUI();

        console.log('重置系统');
    }

    setPlaySpeed(speed) {
        this.playSpeed = speed;
        console.log('设置播放速度:', speed);
    }

    executeScenario() {
        if (!this.currentScenario || !this.currentOrder) return;

        const nextStep = this.currentScenario.steps[this.currentStepIndex];

        if (!nextStep) {
            // 场景完成
            this.completeScenario();
            return;
        }

        if (!this.isValidTransition(nextStep.from, nextStep.to)) {
            // 尝试跳转到下一个有效转换
            this.findNextValidStep();
            return;
        }

        this.currentStepIndex++;

        const delay = (this.currentScenario.delays[this.currentStepIndex - 1] || 1000) / this.playSpeed;

        this.stepTimer = setTimeout(() => {
            this.transitionToState(nextStep.to, nextStep.note);

            if (this.isPlaying) {
                this.executeScenario();
            }
        }, delay);

        // 显示转换信息
        this.renderer.renderTransitionInfo(nextStep.from, nextStep.to);
    }

    executeNextStep() {
        if (!this.currentScenario || !this.currentOrder) return;

        const nextStep = this.currentScenario.steps[this.currentStepIndex];

        if (!nextStep) {
            this.completeScenario();
            return;
        }

        this.currentStepIndex++;
        this.transitionToState(nextStep.to, nextStep.note);

        // 显示转换信息
        this.renderer.renderTransitionInfo(nextStep.from, nextStep.to);

        if (this.currentStepIndex >= this.currentScenario.steps.length) {
            this.completeScenario();
        }
    }

    findNextValidStep() {
        // 跳过无效的步骤，找到下一个有效的状态转换
        while (this.currentStepIndex < this.currentScenario.steps.length) {
            const step = this.currentScenario.steps[this.currentStepIndex];

            if (this.isValidTransition(step.from, step.to)) {
                // 找到有效的步骤
                this.currentStepIndex++;
                const delay = (this.currentScenario.delays[this.currentStepIndex - 1] || 1000) / this.playSpeed;

                this.stepTimer = setTimeout(() => {
                    this.transitionToState(step.to, step.note);

                    if (this.isPlaying) {
                        this.executeScenario();
                    }
                }, delay);

                return;
            }

            this.currentStepIndex++;
        }

        // 没有找到有效步骤，场景完成
        this.completeScenario();
    }

    continueScenario() {
        // 继续从当前步骤执行
        this.executeScenario();
    }

    transitionToState(newState, note = '') {
        if (!this.currentOrder) return;

        const fromState = this.currentOrder.status;

        if (!this.isValidTransition(fromState, newState)) {
            console.warn(`无效的状态转换: ${fromState} -> ${newState}`);
            return;
        }

        // 更新订单状态
        this.currentOrder.updateStatus(newState, note);

        // 添加参与者
        const transitionInfo = this.stateMachine.getTransitionInfo(fromState, newState);
        if (transitionInfo && transitionInfo.responsibleParty) {
            this.currentOrder.addParticipant(transitionInfo.responsibleParty);
        }

        console.log(`状态转换: ${fromState} -> ${newState}`);

        // 渲染更新
        this.renderCurrentState();

        // 如果是最终状态，标记为完成
        const stateInfo = this.stateMachine.getStateInfo(newState);
        if (stateInfo.nextStates.length === 0) {
            this.completeScenario();
        }
    }

    isValidTransition(fromState, toState) {
        if (!fromState || !toState) return false;

        // 特殊处理部分成交状态
        if (fromState === 'partially_filled' && toState === 'partially_filled') {
            return true;
        }

        return this.stateMachine.isValidTransition(fromState, toState);
    }

    renderCurrentState() {
        if (!this.currentOrder) return;

        // 渲染流程图
        const mermaidCode = this.renderer.generateFlowchart(
            this.currentOrder.history,
            this.currentOrder.status
        );
        this.renderer.renderFlowchart(mermaidCode);

        // 渲染时间线
        this.renderer.renderTimeline(
            this.currentOrder.history,
            this.currentOrder.status
        );

        // 渲染状态信息
        this.renderer.renderStateInfo(this.currentOrder.status);

        // 更新进度统计
        if (this.startTime) {
            this.renderer.updateProgressStats(
                this.currentOrder.history,
                this.currentOrder.status,
                this.startTime
            );
        }
    }

    completeScenario() {
        this.isPlaying = false;
        this.showToast('演示完成！', 'success');

        // 显示完成统计
        if (this.currentOrder) {
            const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            console.log(`演示完成：${this.currentOrder.history.length}个状态，耗时${elapsedSeconds}秒`);
        }

        this.updateUI();
    }

    clearVisualization() {
        // 重置流程图容器
        const flowchartContainer = document.getElementById('flowchart-container');
        flowchartContainer.innerHTML = `
            <div class="placeholder-text">
                <i class="fas fa-play-circle fa-3x text-muted mb-3 d-block"></i>
                请点击"创建订单"开始演示
            </div>
        `;

        // 重置时间线容器
        const timelineContainer = document.getElementById('timeline-container');
        timelineContainer.innerHTML = `
            <div class="placeholder-text text-center">
                <i class="fas fa-clock fa-2x text-muted mb-2 d-block"></i>
                时间线将在订单创建后显示
            </div>
        `;

        // 重置状态信息
        const stateInfo = document.getElementById('stateInfo');
        stateInfo.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-hand-point-left me-2"></i>
                创建订单后，此处将显示当前状态的详细说明。
            </div>
        `;

        // 重置转换信息
        const transitionInfo = document.getElementById('transitionInfo');
        transitionInfo.innerHTML = `
            <div class="alert alert-light">
                <i class="fas fa-arrow-right me-2"></i>
                状态转换时，此处将显示转换条件和说明。
            </div>
        `;

        // 重置进度统计
        document.getElementById('currentState').textContent = '未开始';
        document.getElementById('currentState').className = 'badge bg-secondary';
        document.getElementById('elapsedTime').textContent = '0s';
        document.getElementById('progressPercent').textContent = '0%';
        document.getElementById('progressBar').style.width = '0%';
    }

    updateUI() {
        const hasOrder = this.currentOrder !== null;
        const isComplete = hasOrder && this.stateMachine.getStateInfo(this.currentOrder.status).nextStates.length === 0;

        // 控制按钮状态
        document.getElementById('playBtn').disabled = !hasOrder || this.isPlaying || isComplete;
        document.getElementById('pauseBtn').disabled = !this.isPlaying;
        document.getElementById('stepBtn').disabled = !hasOrder || this.isPlaying || isComplete;
        document.getElementById('resetBtn').disabled = !hasOrder;

        // 速度选择
        document.getElementById('speedSelect').disabled = this.isPlaying;
    }

    showToast(message, type = 'info', duration = 3000) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;

        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
        `;

        document.body.appendChild(toast);

        // 添加动画
        toast.classList.add('slide-in');

        // 自动移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    }

    // 键盘快捷键
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 空格键播放/暂停
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            }

            // 方向键单步
            if (e.code === 'ArrowRight' && !this.isPlaying) {
                e.preventDefault();
                this.step();
            }

            // R键重置
            if (e.code === 'KeyR') {
                e.preventDefault();
                this.reset();
            }
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.tradingApp = new TradingFlowApp();

    // 设置键盘快捷键
    window.tradingApp.setupKeyboardShortcuts();

    console.log('股票交易流程可视化系统已加载');
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('系统错误:', e.error);
    if (window.tradingApp) {
        window.tradingApp.showToast('系统发生错误，请刷新页面', 'danger');
    }
});

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TradingFlowApp
    };
}
