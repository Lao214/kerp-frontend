<template>
    <div class="app-container">
        <!-- 1. 搜索与操作栏 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="queryParams">
                <el-form-item label="关键字">
                    <el-input v-model="queryParams.keyword" style="width: 17vw;" placeholder="请输入关键字（仓库名称或编码）" clearable  @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
            </el-form>

            <!-- 新增按钮栏 -->
            <div class="operation-bar">
                <!-- 新增按钮 -->
                <el-button type="primary" icon="Plus" plain @click="handleAdd">新增仓库</el-button>

                <!-- 批量删除按钮 -->
                <el-button type="danger" icon="Delete" plain :disabled="selectedIds.length === 0"
                    @click="handleDelete">批量删除</el-button>
            </div>
        </el-card>

        <!-- 2. 数据表格 -->
        <el-card class="table-card">
            <el-table v-loading="loading" :data="warehouseList" border stripe @selection-change="handleSelectionChange">
                <!-- Table 部分 -->
                <el-table-column label="仓库编码" prop="code" align="center" width="120" />
                <el-table-column label="仓库名称" prop="name" align="center" width="120"/>
                <el-table-column label="仓库地址" prop="location" align="center" width="80" />
                <el-table-column label="负责人" prop="manager" align="center" width="160" />
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
            <el-form ref="warehouseFormRef" :model="warehouseForm" :rules="rules" label-width="97px">
                <!-- Dialog Form 部分 -->
                <el-form-item label="仓库编码" prop="code">
                    <el-input v-model="warehouseForm.code" placeholder="例如：P001" />
                </el-form-item>
                <el-form-item label="仓库名称" prop="name">
                    <el-input v-model="warehouseForm.name" />
                </el-form-item>
                <el-form-item label="联系人" prop="location">
                    <el-input v-model="warehouseForm.location" />
                </el-form-item>
                <el-form-item label="联系电话" prop="manager">
                    <el-input v-model="warehouseForm.manager" />
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="warehouseForm.remark" placeholder="" style="width: 100px" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-radio-group v-model="warehouseForm.status">
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
import { getWarehouseListApi, addWarehouseApi, updateWarehouseApi, deleteWarehouseApi, type WarehouseInfo } from '../../../api/warehouse'
// 变量定义
const loading = ref(false)
const warehouseList = ref<WarehouseInfo[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])

// 查询参数
const queryParams = reactive({
    page: 1,
    size: 10,
    keyword: ''
})

// 👇 新增：表单引用和数据
const warehouseFormRef = ref<FormInstance>()
// 也不用担心写错成 prodcutCode
const warehouseForm = reactive<WarehouseInfo>({
  code: '',
  name: '',
  location: '',
  manager: '',
  status: 1,
  remark: undefined
  // id 默认为 undefined，完美符合 WarehouseInfo 定义
})

// 👇 新增：表单校验规则
const rules = {
    warehouseName: [{ required: true, message: '仓库名称不能为空', trigger: 'blur' }]
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
        const res: any = await getWarehouseListApi(queryParams)
        // 后端返回的是 IPage 对象，里面有 records 和 total
        warehouseList.value = res.records
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
const handleSelectionChange = (selection: WarehouseInfo[]) => {
    selectedIds.value = selection.map(item => item.id as string)
}

// 页面加载完成后立即查询
onMounted(() => {
    getList()
})

// ✨ 新增按钮点击
const handleAdd = () => {
    resetForm()
    dialog.title = '新增仓库'
    dialog.visible = true
}

// ✨ 编辑按钮点击
const handleEdit = (row: any) => {
    resetForm()
    dialog.title = '修改仓库'
    dialog.visible = true
    // 数据回显：把行数据填入表单
    nextTick(() => {
        Object.assign(warehouseForm, row)
    })
}

// ✨ 提交表单
const submitForm = async () => {
    if (!warehouseFormRef.value) return
    await warehouseFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (warehouseForm.id) {
                    await updateWarehouseApi(warehouseForm)
                    ElMessage.success('修改成功')
                } else {
                    await addWarehouseApi(warehouseForm)
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
    const warehouseIds = row?.id ? [row.id] : selectedIds.value
    if (warehouseIds.length === 0) return

    ElMessageBox.confirm('确认要删除选中的仓库吗？数据一旦删除无法恢复！', '警告', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        await deleteWarehouseApi(warehouseIds)
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
    warehouseForm.id = undefined
    warehouseForm.code = ''
    warehouseForm.name = ''
    warehouseForm.location = ''
    warehouseForm.manager = ''
    warehouseForm.status = 1
    warehouseForm.remark = undefined
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