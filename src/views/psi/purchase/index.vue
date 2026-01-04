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
                    <el-button type="success" icon="Plus" plain @click="handleOpen"  style="margin-left: 10px">新增采购单</el-button>
                    <el-button type="warning" icon="Iphone" @click="openMobileScan">手机化身扫码枪</el-button>
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
                        <!-- <el-button v-if="row.status === 2" v-permission="['psi:purchase:audit']" link type="success" icon="Check" @click="handleAudit(row)">审核</el-button> -->
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
                                <el-select v-model="form.supplierId" placeholder="请选择供应商" filterable
                                    style="width: 100%">
                                    <!-- 这里的 options 需要从 API 获取，我暂时写死几个 demo -->
                                    <el-option v-for="supplier in supplierOptions" :key="supplier.id"
                                        :label="supplier.label" :value="supplier.id" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="6">
                            <el-form-item label="入库仓库" prop="warehouseId">
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
                                @change="(val) => handleProductChange(val, row)">
                                <el-option v-for="p in productList" :key="p.id" :label="p.productName" :value="p.id">
                                    <!-- 下拉框里显示 编码+名称 -->
                                    <span style="float: left">{{ p.productName }}</span>
                                    <span style="float: right; color: #8492a6; font-size: 13px">{{ p.productCode }}</span>
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

                    <!-- 在“操作”列之前，或者“备注”列之前 -->
                    <el-table-column label="属性明细" align="center" width="140">
                        <template #default="{ row }">

                            <!-- 情况A：普通商品 -->
                            <span v-if="!row.manageType || row.manageType === 0" style="color:#ccc">-</span>

                            <!-- 情况B：序列号商品 (SN) -->
                            <div v-else-if="row.manageType === 2">
                                <!-- 🔴 状态一：数量对不上 (缺SN 或 多SN) -->
                                <!-- row.snList?.length || 0 用来防空 -->
                                <el-button v-if="(row.snList?.length || 0) !== row.quantity" type="danger" size="small"
                                    icon="Warning" @click="openWmsDialog(row)">
                                    <!-- 动态计算缺几个 -->
                                    缺 {{ Math.abs(row.quantity - (row.snList?.length || 0)) }} 个码
                                </el-button>

                                <!-- 🟢 状态二：数量完美匹配 -->
                                <el-button v-else type="success" size="small" icon="CircleCheck" plain
                                    @click="openWmsDialog(row)">
                                    已录全
                                </el-button>
                            </div>

                            <!-- 情况C：批次商品 -->
                            <div v-else-if="row.manageType === 1">
                                <!-- 🔴 没填批次号 -->
                                <el-button v-if="!row.batchNo" type="danger" size="small" icon="Warning"
                                    @click="openWmsDialog(row)">
                                    缺批次号
                                </el-button>

                                <!-- 🟢 已填 -->
                                <el-button v-else type="primary" size="small" icon="Edit" plain
                                    @click="openWmsDialog(row)">
                                    {{ row.batchNo }}
                                </el-button>
                            </div>

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

        <!-- WMS 信息录入弹窗 -->
        <el-dialog :title="wmsTitle" v-model="wmsVisible" width="500px">

            <!-- 场景A：批次管理 -->
            <div v-if="currentRow.manageType === 1">
                <el-form label-width="80px">
                    <el-form-item label="批次号">
                        <el-input v-model="currentRow.batchNo" placeholder="请输入生产批号" />
                    </el-form-item>
                    <el-form-item label="过期日期">
                        <el-date-picker v-model="currentRow.expireDate" type="date" value-format="YYYY-MM-DD"
                            placeholder="请选择有效期" style="width: 100%" />
                    </el-form-item>
                </el-form>
            </div>

            <!-- 场景B：序列号管理 -->
            <div v-if="currentRow.manageType === 2">
                <el-alert type="info" :closable="false" style="margin-bottom: 10px;">
                    当前采购数量：<b>{{ currentRow.quantity }}</b>，需录入 <b>{{ currentRow.quantity }}</b> 个SN码。
                    <br />(一行一个，支持扫码枪连续扫码)
                </el-alert>

                <!-- 在扫码输入框的上面或下面，加一行操作栏 -->
                <div v-if="currentRow.manageType === 2" style="margin-bottom: 10px;">

                    <!-- 场景一：扫供应商的码 -->
                    <el-alert type="info" :closable="false" style="margin-bottom: 5px;">
                        方式A：直接扫描商品包装上的条码。
                    </el-alert>

                    <!-- 场景二：系统生成内部码 -->
                    <el-row :gutter="10" align="middle">
                        <el-col :span="12">
                            <el-alert type="warning" :closable="false">
                                方式B：商品无码？系统自动生成。
                            </el-alert>
                        </el-col>
                        <el-col :span="12" style="text-align: right;">
                            <el-button type="primary" size="small" @click="autoGenerateSn">
                                自动生成 {{ currentRow.quantity }} 个SN
                            </el-button>
                        </el-col>
                    </el-row>
                </div>

                <el-input v-model="snText" type="textarea" :rows="10" placeholder="在此处扫码或粘贴SN码，每行一个" />
                <div style="text-align: right; margin-top: 5px; color: #666;">
                    已录入: <span :style="{ color: snCount === currentRow.quantity ? 'green' : 'red' }">{{ snCount
                        }}</span>
                    / {{
                        currentRow.quantity }}
                </div>
            </div>

            <template #footer>
                <el-button @click="wmsVisible = false">确 定</el-button>
            </template>
        </el-dialog>

        <!-- 扫码连接弹窗 -->
        <el-dialog title="手机扫码联动" v-model="scanDialogVisible" width="400px" center>
            <div style="text-align: center;">
                <p style="margin-bottom: 20px; color: #666;">请使用 APP 扫描下方二维码<br>建立连接后，手机扫码将自动同步到此页面</p>
                
                <!-- 二维码组件 -->
                <qrcode-vue :value="qrCodeValue" :size="200" level="H" />
                
                <div style="margin-top: 20px;">
                <el-tag v-if="isWsConnected" type="success">🟢 已连接，请在手机上扫商品</el-tag>
                <el-tag v-else type="info">🔴 等待连接...</el-tag>
                </div>
            </div>
        </el-dialog>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { getPurchaseOrderListApi, addPurchaseOrderApi, getAllProductList, auditPurchaseOrderApi, getSupplierOptions, getWarehouseOptions, type PurchaseOrderDTO, type PurchaseOrderItemDTO, type Options } from '../../../api/psi/purchase'
import { ElMessageBox } from 'element-plus'
import type { ProductInfo } from '../../../api/product'
import QrcodeVue from 'qrcode.vue'
import { v4 as uuidv4 } from 'uuid' // 需要 npm install uuid
import { ElNotification } from 'element-plus'

const openMobileScan = () => {
    // 1. 生成唯一会话ID
    const uuid = uuidv4()
    // 2. 生成二维码内容 (格式：SCAN|UUID) 手机扫了就知道要做什么
    qrCodeValue.value = `SCAN|${uuid}`
    scanDialogVisible.value = true
    
    // 3. 建立 WebSocket 连接
    initWebSocket(uuid)
}

const initWebSocket = (uuid: string) => {
    // 注意：生产环境 ws:// 要改成 wss://
    const wsUrl = `ws://localhost:8080/ws/scan/${uuid}`
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
        isWsConnected.value = true
        console.log('WS 连接成功')
    }

    ws.onmessage = (event) => {
        // 🔥 收到消息了！这是手机扫过来的 SN 码
        const snCode = event.data
        console.log('收到扫码:', snCode)
        
        // 执行之前的添加逻辑 (模拟在输入框回车)
        handleScanInput(snCode)
        
        ElNotification({
        title: '扫码成功',
        message: `已录入: ${snCode}`,
        type: 'success',
        duration: 2000
        })
    }

    ws.onclose = () => {
        isWsConnected.value = false
    }
}

// 处理扫码输入
const handleScanInput = (sn: string) => {
    // 这里复用你之前写好的逻辑：
    // 1. 在表格里找商品 -> 数量+1
    // 2. 或者在 SN 录入弹窗里 -> addSnTag()
    // 简单演示：假设我们在录入 SN 弹窗打开的情况下
    if (wmsVisible.value && currentRow.value) {
        currentInputSn.value = sn
        addSnTag() // 调用之前的添加 Tag 方法
    } else {
        ElMessage.warning('请先打开某个商品的 SN 录入窗口，再使用手机扫码')
    }
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

// --- 状态定义 ---
const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const productList = ref<ProductInfo[]>([]) // 商品下拉源数据

const supplierOptions = ref<Options[]>([])
const warehouseOptions = ref<Options[]>([])

// WMS 弹窗相关状态
const wmsVisible = ref(false)
const wmsTitle = ref('')
const currentRow = ref<any>({}) // 当前正在编辑的那一行
const snText = ref('') // SN 文本域内容

// 扫码相关状态
const scanDialogVisible = ref(false)
const qrCodeValue = ref('')
const isWsConnected = ref(false)
const currentInputSn = ref('')
let ws: WebSocket | null = null

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
        row.manageType = product.manageType // 关键！
        // 初始化空数据
        row.batchNo = ''
        row.expireDate = ''
        row.snList = []

        // 🔥🔥🔥 核心修改：自动弹窗逻辑 🔥🔥🔥
        if (row.manageType === 1 || row.manageType === 2) {
            // 使用 nextTick 确保数据已经挂载到 row 上之后，再打开弹窗
            nextTick(() => {
                // 调用你之前写好的打开弹窗方法
                openWmsDialog(row)
                ElMessage.info(`【${product.productName}】需要录入详细属性`)
            })
        }
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
                    // 如果是采购，通常还需要校验过期日期
                    // if (!item.expireDate) { ... }
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
                await addPurchaseOrderApi(form)

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

// 打开录入弹窗
const openWmsDialog = (row: any) => {
    currentRow.value = row
    if (row.manageType === 1) {
        wmsTitle.value = '录入批次信息'
    } else {
        wmsTitle.value = '录入序列号(SN)'
        // 把数组转回文本显示 (换行符分隔)
        snText.value = (row.snList || []).join('\n')
    }
    wmsVisible.value = true
}

// 监听 SN 文本变化，实时回写到 row.snList
import { watch } from 'vue'
watch(snText, (val) => {
    if (currentRow.value.manageType === 2) {
        // 过滤空行，拆分成数组
        const list = val.split('\n').map(s => s.trim()).filter(s => s)
        currentRow.value.snList = list
    }
})

// 计算当前录入的 SN 个数
const snCount = computed(() => {
    if (!snText.value) return 0
    return snText.value.split('\n').filter(s => s.trim()).length
})

// 自动生成 SN 码
const autoGenerateSn = () => {
    const qty = currentRow.value.quantity
    const prefix = 'SN' + new Date().toISOString().slice(2, 10).replace(/-/g, '') // SN231229

    // 生成逻辑：前缀 + 时间戳 + 随机数 (或者你可以调后端接口获取严格递增的序列号)
    const newSns = []
    for (let i = 0; i < qty; i++) {
        // 简单模拟：SN231229 + 随机4位
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        newSns.push(`${prefix}${randomSuffix}${i}`)
    }

    // 覆盖还是追加？通常是覆盖，或者追加不够的数量
    // 这里简单粗暴：直接填满
    currentRow.value.snList = newSns

    // 把生成的码回填到文本域显示给用户看
    snText.value = newSns.join('\n')

    ElMessage.success(`已自动生成 ${qty} 个序列号，请记得打印标签！`)
}

// 记得在组件卸载时断开连接
onUnmounted(() => {
  ws?.close()
})
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