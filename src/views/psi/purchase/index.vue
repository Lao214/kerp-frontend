<template>
    <div class="app-container">
        <el-card>

            <!-- 1. 顶部搜索与操作 -->
            <el-form :inline="true" :model="queryParams" class="search-form">
                <el-form-item label="单据编号">
                    <el-input v-model="queryParams.orderNo" placeholder="请输入单号" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
                        <el-option label="草稿" :value="0" />
                        <el-option label="已审核" :value="1" />
                        <el-option label="已作废" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                    <!-- 新增按钮放在右边 -->
                    <el-button type="success" icon="Plus" plain @click="handleOpen"
                        style="margin-left: 10px">新增采购单</el-button>
                </el-form-item>
            </el-form>

            <!-- 2. 主表格 -->
            <el-table v-loading="tableLoading" :data="tableData" border stripe style="width: 100%; margin-top: 20px">
                <el-table-column label="序号" type="index" width="50" align="center" />
                <el-table-column label="单据编号" prop="orderNo" width="180" align="center" />
                <el-table-column label="单据日期" prop="orderDate" width="120" align="center" />

                <!-- 这里先显示 ID，后续我教你如何显示名称 -->
                <el-table-column label="供应商" prop="supplierId" align="center" />
                <el-table-column label="仓库" prop="warehouseId" align="center" />

                <el-table-column label="总数量" prop="totalQuantity" align="center" width="100" />
                <el-table-column label="总金额" prop="totalAmount" align="center" width="120">
                    <template #default="{ row }">¥{{ row.totalAmount }}</template>
                </el-table-column>

                <el-table-column label="状态" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 0" type="info">草稿</el-tag>
                        <el-tag v-else-if="row.status === 1" type="success">已审核</el-tag>
                         <el-tag v-else-if="row.status === 2" type="info">审核中</el-tag>
                        <el-tag v-else type="danger">已作废</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="创建时间" prop="createTime" width="180" align="center" />

                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                        <!-- 只有草稿状态(0)才能审核和编辑 -->
                        <el-button v-if="row.status === 2" link type="primary" icon="Edit">编辑</el-button>
                        <el-button v-if="row.status === 2" v-permission="['psi:purchase:audit']" link type="success" icon="Check" @click="handleAudit(row)">审核</el-button>
                        <el-button v-if="row.status === 2" link type="danger" icon="Delete">删除</el-button>
                        <el-button v-else link type="info" icon="View">查看</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 3. 分页 -->
            <div style="margin-top: 20px; display: flex; justify-content: flex-end">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size"
                    :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="getList" @current-change="getList" />
            </div>
        </el-card>

        <!-- 🚀 核心：新增采购单 全屏弹窗 -->
        <el-dialog v-model="visible" title="新增采购订单" fullscreen :close-on-click-modal="false" destroy-on-close>
            <div class="form-container">
                <!-- 1. 表头信息 (Supplier & Warehouse) -->
                <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <el-form-item label="供应商" prop="supplierId">
                                <el-select v-model="form.supplierId" placeholder="请选择供应商" filterable style="width: 100%">
                                    <!-- 这里的 options 需要从 API 获取，我暂时写死几个 demo -->
                                    <el-option v-for="supplier in supplierOptions" :key="supplier.id" :label="supplier.label" :value="supplier.id" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="入库仓库" prop="warehouseId">
                                <el-select v-model="form.warehouseId" placeholder="请选择仓库" style="width: 100%">
                                    <el-option v-for="warehouse in warehouseOptions" :key="warehouse.id" :label="warehouse.label" :value="warehouse.id" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="单据日期" prop="orderDate">
                                <el-date-picker v-model="form.orderDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="备注">
                                <el-input v-model="form.remark" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>

                <!-- 2. 中间操作栏 -->
                <div class="table-actions">
                    <el-button type="primary" icon="Plus" plain @click="handleAddRow">添加商品</el-button>
                    <span class="summary-text">
                        总数量：<span class="num">{{ totalQty }}</span>，
                        总金额：<span class="price">¥{{ totalAmount }}</span>
                    </span>
                </div>

                <!-- 3. 动态明细表格 (Editable Table) -->
                <el-table :data="form.items" border stripe max-height="500">
                    <el-table-column label="序号" type="index" width="50" align="center" />

                    <el-table-column label="选择商品" width="250">
                        <template #default="{ row }">
                            <!-- ✅ 修改后：给 val 加个类型，或者直接让它推断 -->
                            <!-- 核心交互：选中商品后，自动带出 info -->
                            <el-select v-model="row.productId" placeholder="搜索商品" filterable
                                @change="(val) => handleProductChange(val, row)">
                                <el-option v-for="p in productList" :key="p.id" :label="p.productName" :value="p.id">
                                    <!-- 下拉框里显示 编码+名称 -->
                                    <span style="float: left">{{ p.productName }}</span>
                                    <span style="float: right; color: #8492a6; font-size: 13px">{{ p.productCode
                                    }}</span>
                                </el-option>
                            </el-select>
                        </template>
                    </el-table-column>

                    <el-table-column label="商品编码" prop="productCode" width="120" />
                    <el-table-column label="单位" prop="unit" width="80" align="center" />

                    <el-table-column label="采购数量" width="150">
                        <template #default="{ row }">
                            <el-input-number v-model="row.quantity" :min="1" size="small" style="width: 100%" />
                        </template>
                    </el-table-column>

                    <el-table-column label="采购单价" width="150">
                        <template #default="{ row }">
                            <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small"
                                style="width: 100%" />
                        </template>
                    </el-table-column>

                    <el-table-column label="小计金额" width="150" align="right">
                        <template #default="{ row }">
                            <!-- 前端自动计算展示，不存数据库，后端会重算 -->
                            ¥{{ (row.quantity * row.unitPrice).toFixed(2) }}
                        </template>
                    </el-table-column>

                    <el-table-column label="备注">
                        <template #default="{ row }">
                            <el-input v-model="row.remark" size="small" />
                        </template>
                    </el-table-column>

                    <el-table-column label="操作" width="80" align="center" fixed="right">
                        <template #default="{ $index }">
                            <el-button type="danger" link icon="Delete" @click="handleDeleteRow($index)"></el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <template #footer>
                <el-button @click="visible = false">取 消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="loading">提 交 订 单</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { getPurchaseOrderListApi, addPurchaseOrderApi, getAllProductList, auditPurchaseOrderApi, getSupplierOptions, getWarehouseOptions, type PurchaseOrderDTO, type PurchaseOrderItemDTO, type Options } from '../../../api/psi/purchase'
import { ElMessageBox } from 'element-plus'
import type { ProductInfo } from '../../../api/product'

// --- 状态定义 ---
const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const productList = ref<ProductInfo[]>([]) // 商品下拉源数据

const supplierOptions = ref<Options[]>([])
const warehouseOptions = ref<Options[]>([])

// --- 列表相关的变量 ---
const tableLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const queryParams = reactive({
    page: 1,
    size: 10,
    orderNo: '',
    status: undefined
})

// 获取本地日期字符串 YYYY-MM-DD
const getToday = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0') // 月份从0开始
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 表单数据
const form = reactive<PurchaseOrderDTO>({
    supplierId: '',
    warehouseId: '',
    orderDate: getToday(), // ✅ 绝对是本地的今天
    remark: '',
    items: []
})

// 校验规则
const rules = {
    supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
    warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }],
    orderDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

// --- 计算属性 (Computed) ---
// 实时计算总数量
const totalQty = computed(() => {
    return form.items.reduce((sum, item) => sum + item.quantity, 0)
})
// 实时计算总金额
const totalAmount = computed(() => {
    return form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)
})

// --- 方法 ---
const fetchSupplierOptions = async () => {
    const res: any = await getSupplierOptions()
    console.log(res)
    supplierOptions.value = res
}

const fetchWarehouseOptions = async () => {
    const res: any = await getWarehouseOptions()
    console.log(res)
    warehouseOptions.value = res
}

// 获取列表
const getList = async () => {
    tableLoading.value = true
    try {
        const res: any = await getPurchaseOrderListApi(queryParams)
        tableData.value = res.records
        total.value = res.total
    } finally {
        tableLoading.value = false
    }
}

// 搜索
const handleQuery = () => {
    queryParams.page = 1
    getList()
}

// 重置
const resetQuery = () => {
    queryParams.orderNo = ''
    queryParams.status = undefined
    handleQuery()
}

// 审核 (暂时打个桩，下一步马上做)
const handleAudit = (row: any) => {
    ElMessageBox.confirm(
        `确认审核单据【${row.orderNo}】吗？审核后将自动入库且不可修改！`,
        '审核确认',
        { confirmButtonText: '确定审核', cancelButtonText: '取消', type: 'warning' }
    ).then(async () => {
        try {
            await auditPurchaseOrderApi(row.id) // 调用接口
            ElMessage.success('审核成功，库存已增加！')
            getList() // 刷新列表，状态应该变绿
        } catch (e) {
            // 报错已经在拦截器处理了
        }
    })
}

// --- 生命周期 ---
onMounted(() => {
    getList() // 进来就查一次
    fetchSupplierOptions()
    fetchWarehouseOptions()
})

// 注意：handleSubmit 成功后，记得调用 getList() 刷新列表
// 在之前的 handleSubmit try-catch 块里：
// ElMessage.success('采购单创建成功！')
// visible.value = false
// getList() // 👈 加上这行

// 打开弹窗
const handleOpen = async () => {
    visible.value = true
    // 如果商品列表为空，去加载一次
    if (productList.value.length === 0) {
        productList.value = await getAllProductList()
    }
}

// 添加一行
const handleAddRow = () => {
    form.items.push({
        productId: '',
        productCode: '',
        unit: '',
        quantity: 1,
        unitPrice: 0,
        remark: ''
    })
}

// 删除一行
const handleDeleteRow = (index: number) => {
    form.items.splice(index, 1)
}

// 🔥 核心：商品选择变更联动
const handleProductChange = (productId: any, row: PurchaseOrderItemDTO) => {
    // 1. 在商品列表中找到选中的那个商品对象
    const product = productList.value.find(p => p.id === productId)
    if (product) {
        // 2. 将商品信息回填到当前行
        row.productCode = product.productCode || ''
        row.unit = product.unit || ''
        row.productName = product.productName || ''
        // 如果商品表里有采购参考价，填进去；没有就填0
        row.unitPrice = product.pricePurchase || 0
    }
}

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return

    // 1. 校验表头
    await formRef.value.validate(async (valid) => {
        if (valid) {
            // 2. 校验表体 (必须有一行数据)
            if (form.items.length === 0) {
                ElMessage.warning('请至少添加一行商品明细！')
                return
            }

            // 3. 校验每一行是否选了商品
            for (const item of form.items) {
                if (!item.productId) {
                    ElMessage.warning('请检查明细行，有未选择商品的行！')
                    return
                }
            }

            loading.value = true
            try {
                await addPurchaseOrderApi(form)
                ElMessage.success('采购单创建成功！')
                visible.value = false
                getList() // 👈 加上这行
                // 这里可以重置表单 form.items = []
                form.items = []
            } finally {
                loading.value = false
            }
        }
    })
}
</script>

<style scoped>
.header-actions {
    margin-bottom: 20px;
}

.table-actions {
    margin: 15px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.summary-text {
    font-size: 14px;
    color: #606266;
}

.num {
    color: #409EFF;
    font-weight: bold;
    font-size: 16px;
}

.price {
    color: #F56C6C;
    font-weight: bold;
    font-size: 18px;
}

.form-container {
    padding: 0 20px;
}
</style>