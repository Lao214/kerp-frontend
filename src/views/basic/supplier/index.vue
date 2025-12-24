<template>
    <div class="app-container">
        <!-- 1. 搜索与操作栏 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="queryParams">
                <el-form-item label="关键字">
                    <el-input v-model="queryParams.keyword" style="width: 17vw;" placeholder="请输入关键字（供应商名称或编码）" clearable  @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
            </el-form>

            <!-- 新增按钮栏 -->
            <div class="operation-bar">
                <!-- 新增按钮 -->
                <el-button type="primary" icon="Plus" plain @click="handleAdd">新增供应商</el-button>

                <!-- 批量删除按钮 -->
                <el-button type="danger" icon="Delete" plain :disabled="selectedIds.length === 0"
                    @click="handleDelete">批量删除</el-button>
            </div>
        </el-card>

        <!-- 2. 数据表格 -->
        <el-card class="table-card">
            <el-table v-loading="loading" :data="supplierList" border stripe @selection-change="handleSelectionChange">
                <!-- Table 部分 -->
                <el-table-column label="供应商编码" prop="code" align="center" width="120" />
                <el-table-column label="供应商名称" prop="name" align="center" width="120"/>
                <el-table-column label="联系人" prop="contact" align="center" width="80" />
                <el-table-column label="联系电话" prop="phone" align="center" width="160" />
                <el-table-column label="邮箱" prop="email" align="center" />
                <el-table-column label="地址" prop="address" align="center" />
                <el-table-column label="应付余额" prop="payableBalance" align="center" width="120">
                    <template #default="{ row }">
                        <!-- 金额大于0显示红色，表示还有欠款 -->
                        <span :style="{ color: row.payableBalance > 0 ? 'red' : 'green', fontWeight: 'bold' }">
                            ¥{{ row.payableBalance || 0 }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" align="center" width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
                        <el-tag v-else type="info">冻结</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" align="center" width="80" />
                <el-table-column label="操作" align="center" width="200" fixed="right">
                    <!-- 表格里的操作列 -->
                    <template #default="scope">
                        <el-button link type="primary" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
                        <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 3. 分页组件 -->
            <div class="pagination-container">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size"
                    :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleQuery" @current-change="handleQuery" />
            </div>
        </el-card>

        <!-- 4. 新增/修改 弹窗 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="49vw" @close="cancel">
            <el-form ref="supplierFormRef" :model="supplierForm" :rules="rules" label-width="97px">
                <!-- Dialog Form 部分 -->
                <el-form-item label="供应商编码" prop="code">
                    <el-input v-model="supplierForm.code" placeholder="例如：P001" />
                </el-form-item>
                <el-form-item label="供应商名称" prop="name">
                    <el-input v-model="supplierForm.name" />
                </el-form-item>
                <el-form-item label="联系人" prop="contact">
                    <el-input v-model="supplierForm.contact" />
                </el-form-item>
                <el-form-item label="联系电话" prop="phone">
                    <el-input v-model="supplierForm.phone" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="supplierForm.email"/>
                </el-form-item>
                <el-form-item label="地址" prop="address">
                    <el-input v-model="supplierForm.address" />
                </el-form-item>
                <el-form-item label="应付余额" prop="payableBalance">
                    <el-input-number v-model="supplierForm.payableBalance" :precision="2" :step="0.1" :min="0" />
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="supplierForm.remark" placeholder="" style="width: 100px" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-radio-group v-model="supplierForm.status">
                        <el-radio :label="1">正常</el-radio>
                        <el-radio :label="0">冻结</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancel">取 消</el-button>
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
// 👇 引入新增的 API
import { getSupplierListApi, addSupplierApi, updateSupplierApi, deleteSupplierApi, type SupplierInfo } from '../../../api/supplier'
// 变量定义
const loading = ref(false)
const supplierList = ref<SupplierInfo[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])

// 查询参数
const queryParams = reactive({
    page: 1,
    size: 10,
    keyword: ''
})

// 👇 新增：表单引用和数据
const supplierFormRef = ref<FormInstance>()
// 也不用担心写错成 prodcutCode
const supplierForm = reactive<SupplierInfo>({
  code: '',
  name: '',
  contact: '',
  phone: '',
  email: undefined,
  address: undefined,
  payableBalance: 0,
  status: 1,
  remark: undefined
  // id 默认为 undefined，完美符合 SupplierInfo 定义
})

// 👇 新增：表单校验规则
const rules = {
    supplierName: [{ required: true, message: '供应商名称不能为空', trigger: 'blur' }]
}

// 👇 新增：弹窗控制变量
const dialog = reactive({
    title: '',
    visible: false
})

// 方法：获取列表数据
const getList = async () => {
    loading.value = true
    try {
        const res: any = await getSupplierListApi(queryParams)
        // 后端返回的是 IPage 对象，里面有 records 和 total
        supplierList.value = res.records
        total.value = res.total
    } finally {
        loading.value = false
    }
}

// 搜索
const handleQuery = () => {
    // 搜索时重置回第一页
    // 注意：如果是翻页触发的，不需要重置 page，但这里为了简单，我们先统调 getList
    // 严谨点：如果是点击搜索按钮，才把 page = 1
    getList()
}

// 重置
const resetQuery = () => {
    queryParams.keyword = ''
    queryParams.page = 1
    getList()
}

// 多选框选中
const handleSelectionChange = (selection: SupplierInfo[]) => {
    selectedIds.value = selection.map(item => item.id as string)
}

// 页面加载完成后立即查询
onMounted(() => {
    getList()
})

// ✨ 新增按钮点击
const handleAdd = () => {
    resetForm()
    dialog.title = '新增供应商'
    dialog.visible = true
}

// ✨ 编辑按钮点击
const handleEdit = (row: any) => {
    resetForm()
    dialog.title = '修改供应商'
    dialog.visible = true
    // 数据回显：把行数据填入表单
    nextTick(() => {
        Object.assign(supplierForm, row)
    })
}

// ✨ 提交表单
const submitForm = async () => {
    if (!supplierFormRef.value) return
    await supplierFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (supplierForm.id) {
                    await updateSupplierApi(supplierForm)
                    ElMessage.success('修改成功')
                } else {
                    await addSupplierApi(supplierForm)
                    ElMessage.success('新增成功6')
                }
                dialog.visible = false
                getList() // 刷新列表
            } catch (error) {
                // 错误被拦截器捕获了
            }
        }
    })
}

// ✨ 删除按钮点击 (支持单删和批量删)
const handleDelete = (row?: any) => {
    const supplierIds = row?.id ? [row.id] : selectedIds.value
    if (supplierIds.length === 0) return

    ElMessageBox.confirm('确认要删除选中的供应商吗？数据一旦删除无法恢复！', '警告', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        await deleteSupplierApi(supplierIds)
        ElMessage.success('删除成功')
        getList() // 刷新列表
    })
}

// 弹窗关闭时重置表单
const cancel = () => {
    dialog.visible = false
    resetForm()
}

const resetForm = () => {
    supplierForm.id = undefined
    supplierForm.code = ''
    supplierForm.name = ''
    supplierForm.contact = ''
    supplierForm.phone = ''
    supplierForm.email = undefined
    supplierForm.address = undefined
    supplierForm.payableBalance = 0
    supplierForm.status = 1
    supplierForm.remark = undefined
}
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.search-card {
    margin-bottom: 20px;
}

.operation-bar {
    margin-top: 10px;
}

.pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>