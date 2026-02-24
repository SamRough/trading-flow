// 可视化渲染模块
class VisualizationRenderer {
    constructor() {
        this.stateMachine = new OrderStateMachine();
        this.currentFlowchart = null;
        this.currentOrder = null;
    }

    // Mermaid流程图定义
    generateFlowchart(orderHistory, currentState) {
        const states = Object.keys(this.stateMachine.states);
        const activeStates = orderHistory.map(h => h.status);
        const currentStateIndex = states.indexOf(currentState);

        let mermaidCode = 'flowchart TD\n';

        // 生成节点
        states.forEach((state, index) => {
            const stateInfo = this.stateMachine.getStateInfo(state);
            const isActive = state === currentState;
            const isCompleted = activeStates.includes(state);

            let nodeStyle = '';
            if (isActive) {
                nodeStyle = ':::active';
            } else if (isCompleted) {
                nodeStyle = ':::completed';
            }

            mermaidCode += `    ${state}["${stateInfo.name}"]${nodeStyle}\n`;
        });

        // 生成连接线
        states.forEach(state => {
            const stateInfo = this.stateMachine.getStateInfo(state);
            if (stateInfo.nextStates) {
                stateInfo.nextStates.forEach(nextState => {
                    const transitionInfo = this.stateMachine.getTransitionInfo(state, nextState);
                    if (!transitionInfo) {
                        console.warn(`No transition rule found for: ${state} -> ${nextState}`);
                    } else {
                        mermaidCode += `    ${state} -->|${transitionInfo.condition}| ${nextState}\n`;
                        console.log(`Transition found: ${state} -> ${transitionInfo.condition} -> ${nextState}`);
                    }
                });
            }
        });

        // 添加样式
        mermaidCode += `
    classDef active fill:#28a745,stroke:#1e7e34,color:#fff
    classDef completed fill:#6c757d,stroke:#495057,color:#fff
    classDef default fill:#f8f9fa,stroke:#007bff,color:#333
`;

        // 调试输出：打印生成的Mermaid代码
        console.log('========== Generated Mermaid Flowchart ==========');
        console.log(mermaidCode);
        console.log('=================================================');

        return mermaidCode;
    }

    // 渲染流程图
    renderFlowchart(mermaidCode, containerId = 'flowchart-container') {
        const container = document.getElementById(containerId);

        // 清除现有内容，防止重复渲染
        container.innerHTML = '';

        // 创建新的Mermaid容器
        const mermaidContainer = document.createElement('div');
        mermaidContainer.className = 'mermaid';
        mermaidContainer.textContent = mermaidCode;
        container.appendChild(mermaidContainer);

        // 确保Mermaid已初始化（只初始化一次）
        if (!window.mermaidInitialized) {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis'
                },
                themeCSS: `
                    .node rect {
                        fill: #f8f9fa;
                        stroke: #007bff;
                        stroke-width: 2px;
                        rx: 8px;
                        ry: 8px;
                    }
                    .node.active rect {
                        fill: #28a745 !important;
                        stroke: #1e7e34 !important;
                    }
                    .node.completed rect {
                        fill: #6c757d !important;
                        stroke: #495057 !important;
                    }
                    .node text {
                        fill: #333 !important;
                        font-weight: 600 !important;
                        font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    }
                    .node.active text {
                        fill: white !important;
                    }
                    .edgePath path {
                        stroke: #007bff !important;
                        stroke-width: 2px !important;
                    }
                    .edgeLabel {
                        background: white !important;
                        border-radius: 4px !important;
                        padding: 2px 6px !important;
                        font-size: 11px !important;
                    }
                `
            });
            window.mermaidInitialized = true;
        }

        // 渲染当前图表
        mermaid.init(undefined, mermaidContainer);

        // 延迟执行滚动，等待Mermaid渲染完成
        setTimeout(() => {
            this.scrollToActiveNode();
        }, 500);
    }

    // 滚动到当前活跃的节点
    scrollToActiveNode() {
        const container = document.getElementById('flowchart-container');
        const svg = container?.querySelector('svg');
        if (!svg) return;

        // 查找活跃节点（基于CSS类名）
        const activeNode = svg.querySelector('.node.active');
        if (activeNode) {
            const nodeRect = activeNode.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // 计算滚动位置，使节点在容器中居中
            const scrollTop = nodeRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2) + (nodeRect.height / 2);
            const scrollLeft = nodeRect.left - containerRect.left + container.scrollLeft - (containerRect.width / 2) + (nodeRect.width / 2);

            // 使用平滑滚动
            container.scrollTo({
                top: Math.max(0, scrollTop),
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
            });
        }
    }

    // 渲染时间线
    renderTimeline(orderHistory, currentState) {
        const container = document.getElementById('timeline-container');

        if (orderHistory.length === 0) {
            container.innerHTML = `
                <div class="placeholder-text text-center">
                    <i class="fas fa-clock fa-2x text-muted mb-2 d-block"></i>
                    时间线将在订单创建后显示
                </div>
            `;
            return;
        }

        let html = '<div class="timeline-items">';

        orderHistory.forEach((record, index) => {
            const stateInfo = this.stateMachine.getStateInfo(record.status);
            const isCurrent = record.status === currentState;
            const isBeforeCurrent = index < orderHistory.length - 1;

            const timestamp = record.timestamp.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            let itemClass = 'timeline-item';
            if (isCurrent) {
                itemClass += ' active';
            } else if (isBeforeCurrent) {
                itemClass += ' completed';
            }

            html += `
                <div class="${itemClass}">
                    <div class="timeline-time">${timestamp}</div>
                    <div class="timeline-title">${stateInfo.name}</div>
                    <div class="timeline-description">${stateInfo.description}</div>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;

        // 滚动到当前项（最新的状态）
        if (currentState) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    }

    // 渲染当前状态信息
    renderStateInfo(state) {
        const container = document.getElementById('stateInfo');
        const stateInfo = this.stateMachine.getStateInfo(state);

        if (!stateInfo) return;

        const participants = this.stateMachine.participants;
        const involvedParticipants = [];

        // 确定参与的参与者
        for (const [key, participant] of Object.entries(participants)) {
            if (this.isParticipantInvolved(state, key)) {
                involvedParticipants.push({ key, ...participant });
            }
        }

        let html = `
            <div class="alert alert-info">
                <h6 class="alert-heading">
                    <i class="fas fa-info-circle me-2"></i>
                    ${stateInfo.name}
                </h6>
                <p class="mb-3">${stateInfo.description}</p>
                <hr>
                <p class="mb-2"><strong>状态颜色:</strong> <span style="color: ${stateInfo.color}">●</span></p>
            </div>

            <div class="mt-3">
                <h6><i class="fas fa-users me-2"></i>涉及参与者</h6>
        `;

        involvedParticipants.forEach(participant => {
            const iconColor = this.getParticipantIconColor(participant.key);
            html += `
                <div class="participant-item">
                    <i class="fas fa-user ${iconColor} me-2"></i>
                    <strong>${participant.name}</strong>
                    <small class="d-block text-muted">${participant.description}</small>
                </div>
            `;
        });

        html += '</div>';

        container.innerHTML = html;
    }

    // 判断参与者是否涉及
    isParticipantInvolved(state, participantKey) {
        const transitionKey = Object.keys(this.stateMachine.transitionRules).find(key =>
            key.startsWith(`${state}_`) || key.endsWith(`_to_${state}`)
        );

        if (transitionKey) {
            const rule = this.stateMachine.transitionRules[transitionKey];
            return rule.responsibleParty === participantKey;
        }

        // 默认参与者映射
        const participantMapping = {
            investor: ['pending_new', 'cancelled'],
            broker: ['validated', 'pending_new', 'routing'],
            exchange: ['submitted', 'queued', 'working', 'partially_filled', 'filled', 'expired'],
            clearing_house: ['pending_settlement', 'filled'],
            custodian: ['settled', 'pending_settlement']
        };

        return participantMapping[participantKey] && participantMapping[participantKey].includes(state);
    }

    // 获取参与者图标颜色
    getParticipantIconColor(participantKey) {
        const colors = {
            investor: 'text-primary',
            broker: 'text-success',
            exchange: 'text-warning',
            clearing_house: 'text-info',
            custodian: 'text-secondary'
        };
        return colors[participantKey] || 'text-dark';
    }

    // 渲染转换信息
    renderTransitionInfo(fromState, toState) {
        const container = document.getElementById('transitionInfo');
        const transitionInfo = this.stateMachine.getTransitionInfo(fromState, toState);

        if (!transitionInfo) {
            return;
        }

        const participant = this.stateMachine.participants[transitionInfo.responsibleParty];

        const html = `
            <div class="alert alert-light">
                <h6 class="alert-heading">
                    <i class="fas fa-arrow-right me-2"></i>
                    状态转换
                </h6>
                <p><strong>转换条件:</strong> ${transitionInfo.condition}</p>
                <p><strong>转换说明:</strong> ${transitionInfo.description}</p>
                <hr>
                <p class="mb-0">
                    <strong>负责方:</strong>
                    <i class="fas fa-user me-1 ${this.getParticipantIconColor(transitionInfo.responsibleParty)}"></i>
                    ${participant.name}
                </p>
            </div>
        `;

        container.innerHTML = html;
    }

    // 更新进度统计
    updateProgressStats(orderHistory, currentState, startTime) {
        const stateInfo = this.stateMachine.getStateInfo(currentState);

        // 更新当前状态
        const statusBadge = document.getElementById('currentState');
        if (statusBadge) {
            statusBadge.textContent = stateInfo.name;
            statusBadge.className = `badge bg-${this.getStatusColorClass(currentState)}`;
        }

        // 计算已用时间
        const elapsedTime = Date.now() - startTime;
        const elapsedSeconds = Math.floor(elapsedTime / 1000);
        const elapsedElement = document.getElementById('elapsedTime');
        if (elapsedElement) {
            elapsedElement.textContent = `${elapsedSeconds}s`;
        }

        // 计算完成进度
        let progressPercent;
        const terminalStates = ['settled', 'cancelled', 'rejected', 'expired'];

        // 如果是终止状态，直接显示100%
        if (terminalStates.includes(currentState)) {
            progressPercent = 100;
        } else if (currentState === 'partially_filled') {
            // 部分成交是75%（接近完成）
            progressPercent = 75;
        } else {
            // 对于中间状态，基于当前状态的位置计算（历史长度 / 到settled的典型路径长度）
            const maxPathLength = 10; // typical path length to settled
            const completedStates = Math.min(orderHistory.length, maxPathLength);
            progressPercent = Math.min(Math.round((completedStates / maxPathLength) * 100), 95);
        }

        const progressElement = document.getElementById('progressPercent');
        const progressBar = document.getElementById('progressBar');

        if (progressElement) {
            progressElement.textContent = `${progressPercent}%`;
        }

        if (progressBar) {
            progressBar.style.width = `${progressPercent}%`;
        }
    }

    // 获取状态颜色类名
    getStatusColorClass(state) {
        const colorClasses = {
            'pending_new': 'warning',
            'validated': 'info',
            'routing': 'primary',
            'submitted': 'primary',
            'queued': 'warning',
            'working': 'success',
            'partially_filled': 'warning',
            'filled': 'success',
            'pending_settlement': 'info',
            'settled': 'secondary',
            'cancelled': 'secondary',
            'rejected': 'danger',
            'expired': 'secondary'
        };
        return colorClasses[state] || 'secondary';
    }

    // 高亮当前流程节点
    highlightCurrentNode(stateId) {
        // 更新Mermaid节点样式
        const mermaidContainer = document.querySelector('.mermaid');
        if (!mermaidContainer) return;

        // 移除所有active类
        const nodes = mermaidContainer.querySelectorAll('.node');
        nodes.forEach(node => {
            node.classList.remove('active');
        });

        // 添加active类到当前节点
        const currentNode = mermaidContainer.querySelector(`g[id*="${stateId}"]`);
        if (currentNode) {
            currentNode.classList.add('active');
        }

        // 滚动到当前节点
        setTimeout(() => {
            this.scrollToActiveNode();
        }, 100);
    }

    // 动画显示状态转换
    animateStateTransition(fromState, toState) {
        // 高亮源状态
        this.highlightCurrentNode(fromState);

        // 短暂延迟后高亮目标状态
        setTimeout(() => {
            this.highlightCurrentNode(toState);
        }, 200);

        // 显示转换动画效果
        const container = document.querySelector('.mermaid');
        if (container) {
            container.classList.add('pulse');
            setTimeout(() => {
                container.classList.remove('pulse');
            }, 1000);
        }
    }
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VisualizationRenderer
    };
}
