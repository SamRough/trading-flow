// 订单状态机核心逻辑
class OrderStateMachine {
    constructor() {
        this.states = {
            pending_new: {
                name: '待创建',
                description: '订单已创建，等待系统审核',
                color: '#ffc107',
                nextStates: ['validated', 'rejected']
            },
            validated: {
                name: '已验证',
                description: '订单通过预交易风控检查',
                color: '#17a2b8',
                nextStates: ['routing', 'rejected']
            },
            routing: {
                name: '路由中',
                description: '订单正在路由到交易所',
                color: '#6f42c1',
                nextStates: ['submitted']
            },
            submitted: {
                name: '已提交',
                description: '订单已到达交易所',
                color: '#007bff',
                nextStates: ['queued', 'working']
            },
            queued: {
                name: '排队中',
                description: '在交易所队列中等待进入订单簿',
                color: '#fd7e14',
                nextStates: ['working']
            },
            working: {
                name: '交易中',
                description: '订单在交易所订单簿中活跃',
                color: '#28a745',
                nextStates: ['partially_filled', 'filled', 'cancelled', 'expired']
            },
            partially_filled: {
                name: '部分成交',
                description: '订单部分执行，剩余部分继续交易',
                color: '#fd7e14',
                nextStates: ['partially_filled', 'filled', 'cancelled']
            },
            filled: {
                name: '完全成交',
                description: '订单全部成交，等待结算',
                color: '#28a745',
                nextStates: ['pending_settlement']
            },
            pending_settlement: {
                name: '待结算',
                description: '订单进入清算结算流程',
                color: '#17a2b8',
                nextStates: ['settled']
            },
            settled: {
                name: '已结算',
                description: '资金和证券交收完成',
                color: '#6c757d',
                nextStates: []
            },
            cancelled: {
                name: '已撤销',
                description: '订单被投资者撤销',
                color: '#6c757d',
                nextStates: []
            },
            rejected: {
                name: '已拒绝',
                description: '订单被风控系统拒绝',
                color: '#dc3545',
                nextStates: []
            },
            expired: {
                name: '已过期',
                description: '订单达到有效期限制',
                color: '#6c757d',
                nextStates: []
            }
        };

        this.participants = {
            investor: {
                name: '投资者',
                description: '个人或机构投资者，交易发起者'
            },
            broker: {
                name: '券商系统',
                description: '提供交易通道和风控检查'
            },
            exchange: {
                name: '交易所',
                description: '提供订单撮合和交易执行'
            },
            clearing_house: {
                name: '清算所',
                description: '中央对手方清算和净额处理'
            },
            custodian: {
                name: '存管机构',
                description: '提供证券托管和交收服务'
            }
        };

        this.transitionRules = {
            pending_new_to_validated: {
                condition: '风控检查通过',
                description: '订单通过所有预交易风险检查',
                responsibleParty: 'broker'
            },
            pending_new_to_rejected: {
                condition: '风控检查失败',
                description: '订单未通过风险检查或账户验证',
                responsibleParty: 'broker'
            },
            validated_to_routing: {
                condition: '路由算法选择',
                description: '智能路由算法选择合适的交易所',
                responsibleParty: 'broker'
            },
            routing_to_submitted: {
                condition: '订单到达交易所',
                description: '订单成功传输到交易所系统',
                responsibleParty: 'exchange'
            },
            submitted_to_queued: {
                condition: '订单簿队列',
                description: '订单等待进入订单簿',
                responsibleParty: 'exchange'
            },
            submitted_to_working: {
                condition: '直接进入订单簿',
                description: '订单立即进入交易所订单簿',
                responsibleParty: 'exchange'
            },
            queued_to_working: {
                condition: '队列处理完成',
                description: '订单从队列进入活跃订单簿',
                responsibleParty: 'exchange'
            },
            working_to_partially_filled: {
                condition: '部分成交',
                description: '订单与对手方部分匹配成交',
                responsibleParty: 'exchange'
            },
            working_to_filled: {
                condition: '完全成交',
                description: '订单全部数量成交',
                responsibleParty: 'exchange'
            },
            working_to_cancelled: {
                condition: '撤单请求',
                description: '投资者发起撤单指令',
                responsibleParty: 'investor'
            },
            working_to_expired: {
                condition: '有效期到期',
                description: '订单达到预设的有效期限',
                responsibleParty: 'exchange'
            },
            partially_filled_to_partially_filled: {
                condition: '继续部分成交',
                description: '订单再次部分执行',
                responsibleParty: 'exchange'
            },
            partially_filled_to_filled: {
                condition: '剩余部分成交',
                description: '订单剩余数量全部成交',
                responsibleParty: 'exchange'
            },
            partially_filled_to_cancelled: {
                condition: '撤单请求',
                description: '投资者撤销未完成部分',
                responsibleParty: 'investor'
            },
            filled_to_pending_settlement: {
                condition: '交易确认',
                description: '成交信息发送到清算系统',
                responsibleParty: 'exchange'
            },
            pending_settlement_to_settled: {
                condition: 'T+1结算完成',
                description: '资金和证券完成交收',
                responsibleParty: 'custodian'
            }
        };
    }

    getStateInfo(state) {
        return this.states[state] || null;
    }

    isValidTransition(fromState, toState) {
        const stateInfo = this.getStateInfo(fromState);
        return stateInfo && stateInfo.nextStates.includes(toState);
    }

    getTransitionInfo(fromState, toState) {
        const key = `${fromState}_to_${toState}`;
        return this.transitionRules[key] || null;
    }
}

class Order {
    constructor(stockCode, orderType, quantity, price = null) {
        this.id = this.generateId();
        this.stockCode = stockCode;
        this.orderType = orderType;
        this.quantity = quantity;
        this.price = price;
        this.status = 'pending_new';
        this.history = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.filledQuantity = 0;
        this.participants = [];

        // 添加初始状态到历史
        this.addStatusToHistory('pending_new', '订单创建');
    }

    generateId() {
        return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    addStatusToHistory(status, note = '') {
        this.history.push({
            status: status,
            timestamp: new Date(),
            note: note
        });
    }

    updateStatus(newStatus, note = '') {
        this.status = newStatus;
        this.updatedAt = new Date();
        this.addStatusToHistory(newStatus, note);
    }

    addParticipant(participant) {
        if (!this.participants.includes(participant)) {
            this.participants.push(participant);
        }
    }

    getElapsedTime() {
        return new Date() - this.createdAt;
    }
}

class Scenario {
    constructor(name, description, orderType = 'limit') {
        this.name = name;
        this.description = description;
        this.orderType = orderType;
        this.steps = [];
        this.delays = [];
    }

    addStep(fromState, toState, delay = 2000, note = '') {
        this.steps.push({
            from: fromState,
            to: toState,
            note: note
        });
        this.delays.push(delay);
    }
}

// 预设场景工厂
class ScenarioFactory {
    static createNormalBuy() {
        const scenario = new Scenario('normal_buy', '限价单完整流程演示', 'limit');

        scenario.addStep('pending_new', 'validated', 800, '验证资金和持仓');
        scenario.addStep('validated', 'routing', 500, '选择最佳交易所');
        scenario.addStep('routing', 'submitted', 300, '订单到达交易所');
        scenario.addStep('submitted', 'queued', 200, '等待订单簿处理');
        scenario.addStep('queued', 'working', 500, '进入活跃订单簿');
        scenario.addStep('working', 'partially_filled', 1000, '首次部分成交');
        scenario.addStep('partially_filled', 'partially_filled', 800, '二次部分成交');
        scenario.addStep('partially_filled', 'filled', 1000, '剩余部分全部成交');
        scenario.addStep('filled', 'pending_settlement', 500, '发送清算指令');
        scenario.addStep('pending_settlement', 'settled', 1000, 'T+1结算完成');

        return scenario;
    }

    static createInstantFill() {
        const scenario = new Scenario('instant_fill', '市价单立即成交演示', 'market');

        scenario.addStep('pending_new', 'validated', 500, '快速风控检查');
        scenario.addStep('validated', 'routing', 300, '立即路由');
        scenario.addStep('routing', 'submitted', 200, '到达交易所');
        scenario.addStep('submitted', 'working', 300, '直接进入订单簿');
        scenario.addStep('working', 'filled', 400, '市价单立即完全成交');
        scenario.addStep('filled', 'pending_settlement', 300, '准备结算');
        scenario.addStep('pending_settlement', 'settled', 1000, '结算完成');

        return scenario;
    }

    static createPartialFill() {
        const scenario = new Scenario('partial_fill', '大订单分批成交演示', 'limit');

        scenario.addStep('pending_new', 'validated', 800, '验证大订单');
        scenario.addStep('validated', 'routing', 500, '路由到大额交易台');
        scenario.addStep('routing', 'submitted', 300, '到达特殊处理队列');
        scenario.addStep('submitted', 'queued', 400, '大额订单排队');
        scenario.addStep('queued', 'working', 1000, '分批进入订单簿');
        scenario.addStep('working', 'partially_filled', 1500, '第一部分成交');
        scenario.addStep('partially_filled', 'partially_filled', 1200, '第二部分成交');
        scenario.addStep('partially_filled', 'partially_filled', 1000, '第三部分成交');
        scenario.addStep('partially_filled', 'partially_filled', 800, '第四部分成交');
        scenario.addStep('partially_filled', 'filled', 1000, '最后部分成交');
        scenario.addStep('filled', 'pending_settlement', 500, '准备大订单结算');
        scenario.addStep('pending_settlement', 'settled', 1000, '大订单结算完成');

        return scenario;
    }

    static createCancellation() {
        const scenario = new Scenario('cancellation', '撤单流程演示', 'limit');

        scenario.addStep('pending_new', 'validated', 800, '验证通过');
        scenario.addStep('validated', 'routing', 500, '路由到交易所');
        scenario.addStep('routing', 'submitted', 300, '到达交易所');
        scenario.addStep('submitted', 'working', 700, '订单簿中等待');
        scenario.addStep('working', 'cancelled', 1200, '投资者发起撤单');

        return scenario;
    }

    static createRejection() {
        const scenario = new Scenario('rejection', '订单拒绝演示', 'limit');

        scenario.addStep('pending_new', 'validated', 800, '初步验证');
        scenario.addStep('validated', 'rejected', 1000, '深度风控检查发现异常');

        return scenario;
    }

    static createAuction() {
        const scenario = new Scenario('auction', '集合竞价演示', 'limit');

        scenario.addStep('pending_new', 'validated', 800, '集合竞价时段验证');
        scenario.addStep('validated', 'routing', 500, '路由到集合竞价系统');
        scenario.addStep('routing', 'submitted', 200, '进入集合竞价');
        scenario.addStep('submitted', 'queued', 2000, '等待集合竞价结束');
        scenario.addStep('queued', 'working', 1000, '进入连续竞价');
        scenario.addStep('working', 'filled', 800, '开盘成交');
        scenario.addStep('filled', 'pending_settlement', 500, '准备结算');
        scenario.addStep('pending_settlement', 'settled', 1000, '结算完成');

        return scenario;
    }

    static getAllScenarios() {
        return [
            this.createNormalBuy(),
            this.createInstantFill(),
            this.createPartialFill(),
            this.createCancellation(),
            this.createRejection(),
            this.createAuction()
        ];
    }
}

// 订单类型定义
const orderTypes = {
    limit: {
        name: '限价单',
        description: '指定价格或更好价格成交',
        requiresPrice: true,
        riskLevel: 'low'
    },
    market: {
        name: '市价单',
        description: '以当前市场价格立即成交',
        requiresPrice: false,
        riskLevel: 'medium'
    },
    stop: {
        name: '止损单',
        description: '触发价格后转为市价单',
        requiresPrice: true,
        riskLevel: 'high'
    },
    stop_limit: {
        name: '止损限价单',
        description: '触发价格后转为限价单',
        requiresPrice: true,
        riskLevel: 'high'
    }
};

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        OrderStateMachine,
        Order,
        Scenario,
        ScenarioFactory,
        orderTypes
    };
}