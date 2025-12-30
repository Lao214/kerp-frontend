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
                        style="margin-left: 10px">新增销售单</el-button>
                </el-form-item>
            </el-form>

            <!-- 2. 主表格 -->
            <el-table v-loading="tableLoading" :data="tableData" border stripe style="width: 100%; margin-top: 20px">
                <el-table-column label="序号" type="index" width="50" align="center" />
                <el-table-column label="单据编号" prop="orderNo" width="180" align="center" />
                <el-table-column label="单据日期" prop="orderDate" width="120" align="center" />

                <!-- 这里先显示 ID，后续我教你如何显示名称 -->
                <el-table-column label="客户" prop="customerId" align="center" />
                <el-table-column label="仓库" prop="warehouseId" align="center" />

                <el-table-column label="总数量" prop="totalQuantity" align="center" width="100" />
                <el-table-column label="总金额" prop="totalAmount" align="center" width="120">
                    <template #default="{ row }">¥{{ row.totalAmount }}</template>
                </el-table-column>

                <el-table-column label="状态" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 0" type="info">草稿</el-tag>
                        <el-tag v-else-if="row.status === 1" type="success">已审核</el-tag>
                        <el-tag v-else type="danger">已作废</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="创建时间" prop="createTime" width="180" align="center" />

                <el-table-column label="操作" width="200" align="center" fixed="right">
                    <template #default="{ row }">
                        <!-- 只有草稿状态(0)才能审核和编辑 -->
                        <el-button v-if="row.status === 0" link type="primary" icon="Edit">编辑</el-button>
                        <el-button v-if="row.status === 0" link type="success" icon="Check"
                            @click="handleAudit(row)">审核</el-button>
                        <el-button v-if="row.status === 0" link type="danger" icon="Delete">删除</el-button>
                        <el-button v-else link type="info" icon="View">查看</el-button>
                        <!-- 🔥 打印按钮：点击触发 handlePrint -->
                        <el-button link type="warning" icon="Printer" @click="handlePrint(row)">打印</el-button>
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

        <!-- 🚀 核心：新增销售单 全屏弹窗 -->
        <el-dialog v-model="visible" title="新增销售订单" fullscreen :close-on-click-modal="false" destroy-on-close>
            <div class="form-container">
                <!-- 1. 表头信息 (Custome & Warehouse) -->
                <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
                    <el-row :gutter="20">
                        <el-col :span="6">
                            <el-form-item label="客户" prop="customerId">
                                <el-select v-model="form.customerId" placeholder="请选择客户" filterable style="width: 100%">
                                    <!-- 这里的 options 需要从 API 获取，我暂时写死几个 demo -->
                                    <el-option v-for="customer in customerOptions" :key="customer.id"
                                        :label="customer.label" :value="customer.id" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="出库仓库" prop="warehouseId">
                                <el-select v-model="form.warehouseId" placeholder="请选择仓库" style="width: 100%">
                                    <el-option v-for="warehouse in warehouseOptions" :key="warehouse.id"
                                        :label="warehouse.label" :value="warehouse.id" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="单据日期" prop="orderDate">
                                <el-date-picker v-model="form.orderDate" type="date" value-format="YYYY-MM-DD"
                                    style="width: 100%" />
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
                                @change="handleProductChange($event, row)">
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

                    <el-table-column label="销售数量" width="150">
                        <template #default="{ row }">
                            <el-input-number v-model="row.quantity" :min="1" size="small" style="width: 100%" />
                        </template>
                    </el-table-column>

                    <el-table-column label="销售单价" width="150">
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

                    <el-table-column label="SN录入" align="center" width="120">
                        <template #default="{ row }">
                            <el-button v-if="row.manageType === 2" link type="danger" icon="Barcode"
                                @click="openSnDialog(row)">
                                {{ (row.snList && row.snList.length > 0) ? `已选${row.snList.length}个` : '扫码出库' }}
                            </el-button>
                            <span v-else style="color:#999">-</span>
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


        <!-- 👇👇👇 隐藏的打印模板区域 (平时看不见，打印时才出来) 👇👇👇 -->
        <!-- 👇👇👇 核心修改：引用组件 👇👇👇 -->
        <!-- 依然需要放在 display: none 里，因为我们不需要它在页面上显示出来 -->
        <div style="display: none">
            <!-- 给组件包一个 id，供 v-print 指令查找 -->
            <div id="printMe">
                <!-- 引入刚才写的组件，传入数据 -->
                <SalesPrintTemplate v-if="printData.orderNo" :data="printData"
                    :user-name="userStore.username || 'Admin'" />
            </div>
        </div>

        <!-- 触发按钮 -->
        <button v-show="false" ref="printBtnRef" v-print="printObj"></button>


        <el-dialog title="扫码出库" v-model="snVisible" width="500px">
            <el-alert type="warning" :closable="false" style="margin-bottom: 10px;">
                需出库数量：<b>{{ currentRow.quantity }}</b>
            </el-alert>

            <!-- 扫码输入框 -->
            <el-input v-model="currentInputSn" placeholder="请扫描SN码后回车" @keyup.enter="addSnTag" > <!-- 🔥 核心就是这个监听回车 -->
                <template #append>
                    <el-button @click="addSnTag">添加</el-button>
                </template>
            </el-input>

            <!-- 已录入的 SN 列表 -->
            <div style="margin-top: 10px; border: 1px solid #eee; padding: 10px; min-height: 100px;">
                <el-tag v-for="(sn, index) in currentRow.snList" :key="index" closable
                    style="margin-right: 5px; margin-bottom: 5px;" @close="removeSnTag(index)">
                    {{ sn }}
                </el-tag>
            </div>

            <template #footer>
                <el-button @click="snVisible = false">完成</el-button>
            </template>
        </el-dialog>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { getSalesOrderListApi, addSalesOrderApi, getAllProductList, auditSalesOrderApi, getCustomerOptions, getWarehouseOptions, getSalesOrderDetailApi, type SalesOrderDTO, type SalesOrderItemDTO, type Options, type SalesOrderDetail } from '../../../api/psi/sales'
import { ElMessageBox } from 'element-plus'
import type { ProductInfo } from '../../../api/product'
import { useUserStore } from '../../../stores/user'

// 👇 1. 引入新组件，并添加类型注释解决 Vetur 插件报错
// @ts-ignore
import SalesPrintTemplate from '../../../components/SalesPrintTemplate.vue'


const snVisible = ref(false)
const currentInputSn = ref('')
const currentRow = ref<any>({})

const openSnDialog = (row: any) => {
    currentRow.value = row
    if (!row.snList) row.snList = []
    snVisible.value = true
}

const addSnTag = () => {
    const sn = currentInputSn.value.trim()
    if (!sn) return

    // 校验是否重复录入
    if (currentRow.value.snList.includes(sn)) {
        ElMessage.warning('该SN码已在列表中')
        return
    }

    // 校验数量是否超标
    if (currentRow.value.snList.length >= currentRow.value.quantity) {
        ElMessage.warning('录入数量已达标，不可多录')
        return
    }

    currentRow.value.snList.push(sn)
    currentInputSn.value = '' // 清空输入框，方便下一次扫码
}

const removeSnTag = (index: number) => {
    currentRow.value.snList.splice(index, 1)
}

const userStore = useUserStore()
const printBtnRef = ref() // 绑定那个隐藏按钮

// 打印数据模型
const printData = ref({
    orderNo: '',
    customerName: '',
    orderDate: '',
    totalQuantity: 0,
    totalAmount: 0,
    items: [] as any[]
})

// v-print 配置项
const printObj = reactive({
    id: 'printMe', // 要打印的区域 ID
    popTitle: '销售出库单', // 浏览器打印预览的标题
    // 打印前的回调
    beforeOpenCallback() {
        console.log('正在启动打印机...')
    }
})

// 🔥 点击打印
const handlePrint = async (row: any) => {
    // 1. 准备数据
    // 最佳实践：这里应该调用后端接口 getDetail(row.id) 获取完整数据
    // 但为了演示，我们假设 row 里已经有了 items (如果没有，你需要去查)

    const fullData: SalesOrderDetail = await getSalesOrderDetailApi(row.id)

    printData.value = {
        orderNo: fullData.orderNo,
        customerName: fullData.customerName || 'xx', // 建议后端 list 接口直接返回名字
        orderDate: fullData.orderDate,
        totalQuantity: fullData.totalQuantity,
        totalAmount: fullData.totalAmount,
        items: fullData.items || []
    }

    // 2. 等待 DOM 更新数据
    await nextTick()

    // 3. 模拟点击那个带有 v-print 指令的按钮
    if (printBtnRef.value) {
        printBtnRef.value.click()
    }
}

// --- 状态定义 ---
const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const productList = ref<ProductInfo[]>([]) // 商品下拉源数据

const customerOptions = ref<Options[]>([])
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
const form = reactive<SalesOrderDTO>({
    customerId: '',
    warehouseId: '',
    orderDate: getToday(), // ✅ 绝对是本地的今天
    remark: '',
    items: []
})

// 校验规则
const rules = {
    customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
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
const fetchCustomerOptions = async () => {
    const res: any = await getCustomerOptions()
    console.log(res)
    customerOptions.value = res
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
        const res: any = await getSalesOrderListApi(queryParams)
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
        `确认审核单据【${row.orderNo}】吗？审核后将自动出库且不可修改！`,
        '审核确认',
        { confirmButtonText: '确定审核', cancelButtonText: '取消', type: 'warning' }
    ).then(async () => {
        try {
            await auditSalesOrderApi(row.id) // 调用接口
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
    fetchCustomerOptions()
    fetchWarehouseOptions()
})

// 注意：handleSubmit 成功后，记得调用 getList() 刷新列表
// 在之前的 handleSubmit try-catch 块里：
// ElMessage.success('销售单创建成功！')
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
// 修复类型错误：给val参数添加明确的类型注解
const handleProductChange = (val: string | number, row: SalesOrderItemDTO) => {
    // 1. 在商品列表中找到选中的那个商品对象
    const product = productList.value.find(p => p.id === val)
    if (product) {
        // 2. 将商品信息回填到当前行
        row.productCode = product.productCode || ''
        row.unit = product.unit || ''
        row.productName = product.productName || ''
        // 如果商品表里有销售参考价，填进去；没有就填0
        row.unitPrice = product.priceSale || 0
    }
}

// 提交表单
const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (valid) {
            // ============ 🔥 WMS 核心校验逻辑开始 🔥 ============

            // 检查明细行是否为空
            if (form.items.length === 0) {
                ElMessage.warning('请至少添加一行商品明细！')
                return
            }

            // 遍历每一行进行“深度质检”
            for (const [index, item] of form.items.entries()) {
                const rowNum = index + 1
                const pName = item.productName || '未知商品'

                // 1. 检查基础数量
                if (!item.quantity || item.quantity <= 0) {
                    ElMessage.error(`第${rowNum}行商品【${pName}】数量必须大于0`)
                    return
                }

                // 2. 检查批次商品 (manageType === 1)
                if (item.manageType === 1) {
                    if (!item.batchNo) {
                        ElMessage.error(`第${rowNum}行商品【${pName}】是批次管理，必须录入【批次号】`)
                        return
                    }
                    // 🔥 新增：校验过期日期
                    if (!item.expireDate) {
                        ElMessage.error(`第${rowNum}行商品【${pName}】是批次管理，必须录入【过期日期】`)
                        return
                    }

                     // 将 expireDate 转为 Date 对象（兼容字符串 YYYY-MM-DD）
                    const expireDate = new Date(item.expireDate)
                    // 处理可能的无效日期
                    if (isNaN(expireDate.getTime())) {
                        ElMessage.error(`第${rowNum}行商品【${pName}】的过期日期格式无效，请使用 YYYY-MM-DD 格式`)
                        return
                    }

                    // 获取今天的日期（只比较日期部分，忽略时分秒）
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    expireDate.setHours(0, 0, 0, 0);

                    if (expireDate <= today) {
                        ElMessage.error(`第${rowNum}行商品【${pName}】已过期（过期日期：${item.expireDate}），不允许入库/出库！`)
                        return
                    }
                }

                // 3. 检查序列号商品 (manageType === 2)
                if (item.manageType === 2) {
                    const requiredQty = item.quantity
                    const inputSnList = item.snList || [] // 防空指针
                    const actualQty = inputSnList.length

                    if (requiredQty !== actualQty) {
                        ElMessage.error(
                            `第${rowNum}行商品【${pName}】是序列号管理，单据数量 ${requiredQty}，实际录入SN ${actualQty} 个。数量不一致！`
                        )
                        return // 阻断提交
                    }

                    // 3.1 还可以加一个简单的查重校验（防止同一个单据里录了重复的SN）
                    const uniqueSn = new Set(inputSnList)
                    if (uniqueSn.size !== inputSnList.length) {
                        ElMessage.error(`第${rowNum}行商品【${pName}】录入了重复的SN码，请检查！`)
                        return
                    }
                }
            }
            // ============ 🔥 WMS 核心校验逻辑结束 🔥 ============

            loading.value = true
            try {
                // 调用对应的 API (采购用 addPurchaseOrderApi，销售用 addSalesOrderApi)
                // await addPurchaseOrderApi(form) 
                // 这里的 API 根据你当前的文件是 采购 还是 销售 自己换一下
                await addSalesOrderApi(form)

                ElMessage.success('单据创建成功！')
                visible.value = false
                // 重置表单
                form.items = []
                form.remark = ''
                getList()
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