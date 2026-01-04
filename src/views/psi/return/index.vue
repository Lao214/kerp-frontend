<template>
    <div class="app-container">
        <el-card>
            <!-- 1. 顶部搜索 -->
            <el-form :inline="true" :model="queryParams">
                <el-form-item label="退货单号">
                    <el-input v-model="queryParams.returnNo" placeholder="请输入单号" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
                    <el-button type="success" icon="Plus" @click="handleOpenSourceSelect">新增退货</el-button>
                </el-form-item>
            </el-form>

            <!-- 2. 退货单主表 -->
            <el-table :data="tableData" border stripe v-loading="loading" style="margin-top: 20px">
                <el-table-column prop="returnNo" label="退货单号" width="180" align="center" />
                <el-table-column prop="sourceOrderNo" label="源销售单" width="180" align="center" />
                <el-table-column prop="returnDate" label="退货日期" width="120" align="center" />
                <el-table-column prop="customerName" label="客户" align="center" /> <!-- 需后端关联 -->
                <el-table-column prop="totalAmount" label="退款金额" align="center">
                    <template #default="{ row }">
                        <span style="color: red">¥{{ row.totalAmount }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" align="center">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 1" type="success">已入库</el-tag>
                        <el-tag v-else type="info">草稿</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button v-if="row.status === 0" link type="success" icon="Check"
                            @click="handleAudit(row)">审核</el-button>
                        <el-button v-if="row.status === 0" link type="danger" icon="Delete"
                            @click="handleDelete(row)">删除</el-button>
                        <el-button v-else link type="primary" icon="View">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 🔥 弹窗 A：选择源销售单 -->
        <el-dialog title="选择关联销售单" v-model="sourceVisible" width="800px">
            <el-form :inline="true" :model="sourceParams">
                <el-form-item label="销售单号">
                    <el-input v-model="sourceParams.orderNo" placeholder="SO..." />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="getSourceList">查询</el-button>
                </el-form-item>
            </el-form>
            <el-table :data="sourceList" border highlight-current-row @row-click="handleSelectSource"
                style="cursor: pointer">
                <el-table-column prop="orderNo" label="销售单号" />
                <el-table-column prop="orderDate" label="销售日期" />
                <el-table-column prop="customerName" label="客户" /> <!-- 需后端关联 -->
                <el-table-column prop="totalAmount" label="总金额" />
                <el-table-column label="操作" width="100" align="center">
                    <template #default>
                        <el-button link type="primary">选择</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>

        <!-- 🔥 弹窗 B：填写退货详情 -->
        <el-dialog title="新建退货单" v-model="formVisible" width="900px" :close-on-click-modal="false">
            <el-form :model="form" label-width="90px">
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="源单号">
                            <el-input v-model="form.sourceOrderNo" disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="退货日期">
                            <el-date-picker v-model="form.returnDate" type="date" value-format="YYYY-MM-DD"
                                style="width:100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="退入仓库">
                            <!-- 这里回显原单仓库，也允许修改 -->
                            <el-select v-model="form.warehouseId" disabled>
                                <el-option label="默认仓库" :value="form.warehouseId" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <!-- 退货明细表 -->
                <el-table :data="form.items" border stripe max-height="400">
                    <el-table-column prop="productName" label="商品名称" />
                    <el-table-column label="原单数量" width="80" align="center">
                        <template #default="{ row }">{{ row.maxQuantity }}</template>
                    </el-table-column>

                    <el-table-column label="本次退货" width="140" align="center">
                        <template #default="{ row }">
                            <el-input-number v-model="row.quantity" :min="0" :max="row.maxQuantity" size="small" />
                        </template>
                    </el-table-column>

                    <el-table-column label="退货单价" width="120" align="center">
                        <template #default="{ row }">
                            <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small"
                                style="width: 100%" />
                        </template>
                    </el-table-column>

                    <!-- 核心：属性录入 (SN/批次) -->
                    <el-table-column label="属性录入" width="130" align="center">
                        <template #default="{ row }">
                            <!-- 只有退货数量 > 0 才需要录入 -->
                            <div v-if="row.quantity > 0">

                                <!-- SN 商品 -->
                                <el-button v-if="row.manageType === 2"
                                    :type="row.snList?.length === row.quantity ? 'success' : 'danger'" size="small"
                                    icon="Barcode" @click="openSnSelect(row)">
                                    选SN ({{ row.snList?.length || 0 }}/{{ row.quantity }})
                                </el-button>

                                <!-- 批次 商品 -->
                                <div v-else-if="row.manageType === 1">
                                    <el-input v-model="row.batchNo" placeholder="批次号" size="small"
                                        style="margin-bottom: 5px" />
                                    <el-date-picker v-model="row.expireDate" type="date" value-format="YYYY-MM-DD"
                                        placeholder="有效期" size="small" style="width: 100%" />
                                </div>

                                <span v-else style="color: #999">-</span>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>

                <div style="margin-top: 10px; text-align: right; font-weight: bold; color: red;">
                    退款总额：¥{{ totalReturnAmount }}
                </div>
            </el-form>

            <template #footer>
                <el-button @click="formVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitting">确认退货</el-button>
            </template>
        </el-dialog>

        <!-- 🔥 弹窗 C：SN 勾选器 -->
        <el-dialog title="勾选要退回的SN" v-model="snVisible" width="400px">
            <el-alert type="info" :closable="false" style="margin-bottom: 10px">
                该商品原单卖出了 {{ currentItem.maxQuantity }} 个，请勾选本次退回的 {{ currentItem.quantity }} 个。
            </el-alert>

            <el-checkbox-group v-model="currentItem.snList">
                <div v-for="sn in currentItem.sourceSnList" :key="sn" style="margin: 5px 0;">
                    <el-checkbox :label="sn" border style="width: 100%">{{ sn }}</el-checkbox>
                </div>
            </el-checkbox-group>

            <template #footer>
                <el-button @click="snVisible = false">完成</el-button>
            </template>
        </el-dialog>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 假设你已经定义好了 API
import { getSalesReturnListApi, addSalesReturnApi, auditSalesReturnApi, deleteSalesReturnApi } from '../../../api/psi/return'
import { getSalesOrderListApi, getSalesOrderDetailApi } from '../../../api/psi/sales'

// --- 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const queryParams = reactive({ page: 1, size: 10, returnNo: '' })

const sourceVisible = ref(false)
const sourceParams = reactive({ orderNo: '', status: 1 }) // 只查已出库(status=1)
const sourceList = ref([])

const formVisible = ref(false)
const submitting = ref(false)
const form = reactive<any>({ items: [] })

const snVisible = ref(false)
const currentItem = ref<any>({})

// --- 列表逻辑 ---
const getList = async () => {
    loading.value = true
    const res: any = await getSalesReturnListApi(queryParams)
    tableData.value = res.records
    loading.value = false
}

// --- 新增退货：选择源单 ---
const handleOpenSourceSelect = () => {
    sourceVisible.value = true
    getSourceList()
}

const getSourceList = async () => {
    const res: any = await getSalesOrderListApi({ page: 1, size: 20, ...sourceParams })
    sourceList.value = res.records
}

// --- 选中源单，初始化退货表单 ---
const handleSelectSource = async (row: any) => {
    // 1. 查详情
    const res: any = await getSalesOrderDetailApi(row.id)

    // 2. 初始化表头
    form.sourceOrderNo = res.orderNo
    form.customerId = res.customerId
    form.warehouseId = res.warehouseId
    form.returnDate = new Date().toISOString().split('T')[0]

    // 3. 初始化明细 (重点！)
    form.items = res.items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        manageType: item.manageType,
        // 默认退货数量为 0，防止用户误操作全退
        quantity: 0,
        // 记录最大可退数量
        maxQuantity: item.quantity,
        unitPrice: item.unitPrice, // 默认按原价退
        // 保存原单所有SN，供勾选
        sourceSnList: item.snList || [],
        // 已选的SN
        snList: [],
        // 批次字段
        batchNo: '',
        expireDate: ''
    }))

    sourceVisible.value = false
    formVisible.value = true
}

// --- SN 选择逻辑 ---
const openSnSelect = (row: any) => {
    if (row.quantity <= 0) {
        ElMessage.warning('请先输入退货数量')
        return
    }
    currentItem.value = row
    snVisible.value = true
}

// --- 计算总金额 ---
const totalReturnAmount = computed(() => {
    return form.items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice)
    }, 0).toFixed(2)
})

// --- 提交退货单 ---
const handleSubmit = async () => {
    // 1. 过滤掉数量为0的行 (没退的商品不用传给后端)
    const validItems = form.items.filter((item: any) => item.quantity > 0)

    if (validItems.length === 0) {
        ElMessage.warning('请至少填写一项退货数量')
        return
    }

    // 2. 校验
    for (const item of validItems) {
        if (item.quantity > item.maxQuantity) {
            ElMessage.error(`商品【${item.productName}】退货数量不能超过原单数量`)
            return
        }
        // 校验SN
        if (item.manageType === 2) {
            if (item.snList.length !== item.quantity) {
                ElMessage.error(`商品【${item.productName}】需退 ${item.quantity} 个，实际勾选了 ${item.snList.length} 个SN`)
                return
            }
        }
        // 校验批次
        if (item.manageType === 1) {
            if (!item.batchNo) {
                ElMessage.error(`商品【${item.productName}】是批次商品，请填写批次号`)
                return
            }
        }
    }

    submitting.value = true
    try {
        // 组装参数
        const submitData = {
            ...form,
            items: validItems,
            totalAmount: totalReturnAmount.value,
            totalQuantity: validItems.reduce((s: number, i: any) => s + i.quantity, 0)
        }

        await addSalesReturnApi(submitData) // 调用新增接口
        ElMessage.success('退货单创建成功，请审核')
        formVisible.value = false
        getList()
    } finally {
        submitting.value = false
    }
}

// --- 审核 ---
const handleAudit = (row: any) => {
    ElMessageBox.confirm('确认审核入库并退款吗？', '提示', { type: 'warning' })
        .then(async () => {
            await auditSalesReturnApi(row.id)
            ElMessage.success('审核成功')
            getList()
        })
}

// --- 删除 ---
const handleDelete = async (row: any) => {
    await deleteSalesReturnApi([row.id])
    ElMessage.success('删除成功')
    getList()
}

onMounted(() => getList())
</script>