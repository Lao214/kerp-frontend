<template>
    <div class="app-container">
        <el-card>
            <template #header>
                <div class="card-header">
                    <span>🕒 我的待办任务</span>
                    <el-button type="primary" link icon="Refresh" @click="getList">刷新</el-button>
                </div>
            </template>

            <el-table :data="taskList" border stripe v-loading="loading">
                <el-table-column label="任务名称" prop="taskName" align="center" />
                <el-table-column label="关联单据ID" prop="orderId" align="center" width="200" />
                <el-table-column label="任务到达时间" prop="createTime" align="center" width="180" />

                <el-table-column label="操作" align="center" width="200">
                    <template #default="{ row }">
                        <!-- 1. 审之前得先看看单子内容 -->
                        <el-button link type="primary" icon="View" @click="handleDetail(row)">查看详情</el-button>
                        <!-- 2. 审批通过 -->
                        <el-button link type="success" icon="Check" @click="handleApprove(row)">通过</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 采购单详情弹窗 (回显) -->
        <el-dialog title="单据详情审核" v-model="detailVisible" width="800px">
            <div v-if="currentOrder" class="order-detail">
                <el-descriptions title="基本信息" :column="2" border>
                    <el-descriptions-item label="单据编号">{{ currentOrder.orderNo }}</el-descriptions-item>
                    <el-descriptions-item label="单据日期">{{ currentOrder.orderDate }}</el-descriptions-item>
                    <el-descriptions-item label="供应商ID">{{ currentOrder.supplierId }}</el-descriptions-item>
                    <el-descriptions-item label="总金额" label-class-name="price-label">
                        <span style="color: red; font-weight: bold;">¥{{ currentOrder.totalAmount }}</span>
                    </el-descriptions-item>
                </el-descriptions>

                <h4 style="margin-top: 20px">商品明细</h4>
                <el-table :data="currentOrder.items" border size="small">
                    <el-table-column prop="productName" label="商品名称" />
                    <el-table-column prop="quantity" label="数量" width="80" align="center" />
                    <el-table-column prop="unitPrice" label="单价" width="100" align="right" />
                    <el-table-column prop="totalPrice" label="小计" width="100" align="right" />
                </el-table>
            </div>
            <template #footer>
                <el-button @click="detailVisible = false">关 闭</el-button>
                <el-button type="success" @click="handleApprove(selectedTask)">审 核 通 过</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyTasksApi, completeTaskApi } from '../../../api/system/flow'
import { getPurchaseOrderDetailApi } from '../../../api/psi/purchase'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const taskList = ref([])
const detailVisible = ref(false)
const currentOrder = ref<any>(null)
const selectedTask = ref<any>(null)

// 1. 获取待办列表
const getList = async () => {
    loading.value = true
    try {
        const res: any = await getMyTasksApi()
        taskList.value = res || []
    } finally {
        loading.value = false
    }
}

// 2. 查看单据详情
const handleDetail = async (task: any) => {
    selectedTask.value = task
    loading.value = true
    try {
        // 这里的 task.orderId 是后端存入的 BusinessKey
        const res: any = await getPurchaseOrderDetailApi(task.orderId)
        currentOrder.value = res
        detailVisible.value = true
    } finally {
        loading.value = false
    }
}

// 3. 审批通过动作
const handleApprove = (task: any) => {
    ElMessageBox.confirm('确认审批通过该单据吗？', '审批确认', {
        confirmButtonText: '通过',
        cancelButtonText: '取消',
        type: 'success'
    }).then(async () => {
        await completeTaskApi(task.taskId)
        ElMessage.success('审批已通过')
        detailVisible.value = false
        getList() // 刷新列表
    })
}

onMounted(() => {
    getList()
})
</script>

<style scoped>
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.order-detail {
    padding: 10px;
}
</style>