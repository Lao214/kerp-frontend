<template>
    <div class="app-container">
        <el-card>
            <!-- 搜索栏 -->
            <el-form :inline="true" :model="queryParams">
                <el-form-item label="单据号">
                    <el-input v-model="queryParams.receiptNo" placeholder="请输入单号" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button type="success" icon="Plus" @click="handleOpen">新增收款</el-button>
                </el-form-item>
            </el-form>

            <!-- 表格 -->
            <el-table :data="tableData" border stripe v-loading="loading" style="margin-top: 20px">
                <el-table-column label="收款单号" prop="receiptNo" align="center" width="180" />
                <el-table-column label="客户ID" prop="customerId" align="center" />
                <el-table-column label="收款日期" prop="receiptDate" align="center" width="120" />
                <el-table-column label="金额" prop="amount" align="center" width="120">
                    <template #default="{ row }">
                        <span style="color: green; font-weight: bold;">+¥{{ row.amount }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="方式" prop="paymentMethod" align="center" width="100" />
                <el-table-column label="状态" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 1" type="success">已审核</el-tag>
                        <el-tag v-else type="info">草稿</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" align="center" fixed="right" width="200">
                    <template #default="{ row }">
                        <el-button v-if="row.status === 0" link type="success" icon="Check"
                            @click="handleAudit(row)">审核</el-button>
                        <el-button v-if="row.status === 0" link type="danger" icon="Delete"
                            @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 新增弹窗 -->
        <el-dialog title="新增收款单" v-model="dialog.visible" width="48vw">
            <el-form :model="form" label-width="80px">
                <el-form-item label="客户">
                    <!-- 使用接口获取客户选项 -->
                    <el-select v-model="form.customerId" placeholder="请选择客户" filterable>
                        <el-option 
                            v-for="item in customerOptions" 
                            :key="item.id" 
                            :label="item.label" 
                            :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="收款日期">
                    <el-date-picker v-model="form.receiptDate" type="date" value-format="YYYY-MM-DD" />
                </el-form-item>
                <el-form-item label="金额">
                    <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
                </el-form-item>
                <el-form-item label="收款方式">
                    <el-select v-model="form.paymentMethod">
                        <el-option label="银行转账" value="银行转账" />
                        <el-option label="支付宝" value="支付宝" />
                        <el-option label="现金" value="现金" />
                    </el-select>
                </el-form-item>
                <el-form-item label="备注">
                    <el-input type="textarea" v-model="form.remark" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialog.visible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getReceiptListApi, addReceiptApi, auditReceiptApi, deleteReceiptApi } from '../../../api/finanace/receipt'
import { getCustomerOptionsApi } from '../../../api/customer'
import type { ReceiptInfo } from '../../../api/finanace/receipt'

// 定义客户选项的接口类型
interface CustomerOption {
    id: string
    label: string
}

const loading = ref(false)
const tableData = ref([])
const customerOptions = ref<CustomerOption[]>([]) // 添加客户选项数据类型定义
const queryParams = reactive({ page: 1, size: 10, receiptNo: '' })
const dialog = reactive({ visible: false })
const form = reactive({
    customerId: '',
    receiptDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: '银行转账',
    remark: ''
})

// 获取客户选项列表
const getCustomerOptions = async () => {
    try {
        const res: any = await getCustomerOptionsApi()
        // 确保数据格式正确
        if (Array.isArray(res)) {
            customerOptions.value = res
        } else if (res && Array.isArray(res.data)) {
            customerOptions.value = res.data
        } else {
            customerOptions.value = []
        }
    } catch (error) {
        ElMessage.error('获取客户选项失败')
        customerOptions.value = []
    }
}

const getList = async () => {
    loading.value = true
    const res: any = await getReceiptListApi(queryParams)
    tableData.value = res.records
    loading.value = false
}

const handleOpen = () => {
    form.customerId = ''
    form.amount = 0
    dialog.visible = true
}

const handleSubmit = async () => {
    if (!form.receiptDate) {
        ElMessage.warning('请选择收款日期')
        return
    }

    if (!form.customerId) {
        ElMessage.warning('请选择客户')
        return
    }

    // 创建符合ReceiptInfo接口的对象
    const receiptData: ReceiptInfo = {
        customerId: form.customerId,
        receiptDate: form.receiptDate,
        amount: form.amount,
        paymentMethod: form.paymentMethod,
        remark: form.remark
    }

    await addReceiptApi(receiptData)
    ElMessage.success('保存成功')
    dialog.visible = false
    getList()
}

const handleAudit = (row: any) => {
    ElMessageBox.confirm('确认审核这笔收款吗？将抵扣客户欠款。', '提示', { type: 'warning' })
        .then(async () => {
            await auditReceiptApi(row.id)
            ElMessage.success('审核入账成功！')
            getList()
        })
}

const handleQuery = () => getList()
const handleDelete = async (row: any) => {
    await deleteReceiptApi([row.id])
    ElMessage.success('删除成功')
    getList()
}

onMounted(() => {
    getList()
    getCustomerOptions() // 页面加载时获取客户选项
})
</script>