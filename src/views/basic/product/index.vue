<template>
    <div class="app-container">
        <!-- 1. 搜索与操作栏 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="queryParams">
                <el-form-item label="关键字">
                    <el-input v-model="queryParams.keyword" style="width: 17vw;" placeholder="请输入关键字（商品名称或编码）" clearable  @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
            </el-form>

            <!-- 新增按钮栏 -->
            <div class="operation-bar">
                <!-- 新增按钮 -->
                <el-button type="primary" icon="Plus" plain @click="handleAdd">新增商品</el-button>
                
                <!-- 导入按钮 -->
                <el-button type="success" icon="Upload" plain @click="handleImport">导入商品</el-button>

                <!-- 导入按钮 -->
                <a href="/product.xlsx" style="margin: 0 .5rem;"><el-button type="success" icon="Download" plain >下载商品导入模版</el-button></a> 

                <!-- 批量删除按钮 -->
                <el-button type="danger" icon="Delete" plain :disabled="selectedIds.length === 0" @click="handleDelete">批量删除</el-button>
            </div>
        </el-card>

        <!-- 2. 数据表格 -->
        <el-card class="table-card">
            <el-table v-loading="loading" :data="productList" border stripe @selection-change="handleSelectionChange">
                <!-- Table 部分 -->
                <el-table-column label="商品编码" prop="productCode" align="center" width="120" />
                <el-table-column label="商品名称" prop="productName" align="center" />
                <el-table-column label="单位" prop="unit" align="center" width="80" />
                <el-table-column label="采购价" prop="pricePurchase" align="center" width="100">
                    <template #default="scope">¥{{ scope.row.pricePurchase }}</template>
                </el-table-column>
                <el-table-column label="销售价" prop="priceSale" align="center" width="100">
                    <template #default="scope">
                        <span style="color: red; font-weight: bold;">¥{{ scope.row.priceSale }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="状态" align="center" width="100">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status === 1" type="success">上架</el-tag>
                        <el-tag v-else type="info">下架</el-tag>
                    </template>
                </el-table-column>
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
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" @close="cancel">
            <el-form ref="productFormRef" :model="productForm" :rules="rules" label-width="80px">
                <!-- Dialog Form 部分 -->
                <el-form-item label="商品编码" prop="productCode">
                    <el-input v-model="productForm.productCode" placeholder="例如：P001" />
                </el-form-item>
                <el-form-item label="商品名称" prop="productName">
                    <el-input v-model="productForm.productName" />
                </el-form-item>
                <el-form-item label="销售价格" prop="priceSale">
                    <el-input-number v-model="productForm.priceSale" :precision="2" :step="0.1" :min="0" />
                </el-form-item>
                <el-form-item label="采购价格" prop="pricePurchase">
                    <el-input-number v-model="productForm.pricePurchase" :precision="2" :step="0.1" :min="0" />
                </el-form-item>
                <el-form-item label="单位" prop="unit">
                    <el-input v-model="productForm.unit" placeholder="个/箱/件" style="width: 100px" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-radio-group v-model="productForm.status">
                        <el-radio :label="1">上架</el-radio>
                        <el-radio :label="0">下架</el-radio>
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
        
        <!-- 5. 导入弹窗 -->
        <el-dialog title="导入商品" v-model="importDialog.visible" width="500px">
            <el-upload
                ref="uploadRef"
                class="upload-demo"
                drag
                :auto-upload="false"
                :on-change="handleFileChange"
                :limit="1"
                accept=".xlsx,.xls"
            >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                    将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                    <div class="el-upload__tip">
                        请上传.xls或.xlsx格式的Excel文件，文件大小不超过10MB
                    </div>
                </template>
            </el-upload>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="importDialog.visible = false">取 消</el-button>
                    <el-button type="primary" @click="submitImport" :loading="importDialog.loading">确 定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadInstance, type UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
// 👇 引入新增的 API
import { getProductListApi, addProductApi, updateProductApi, deleteProductApi, importProductApi, type ProductInfo } from '../../../api/product'
// 变量定义
const loading = ref(false)
const productList = ref<ProductInfo[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])
const uploadRef = ref<UploadInstance>()

// 查询参数
const queryParams = reactive({
    page: 1,
    size: 10,
    keyword: ''
})

// 👇 新增：表单引用和数据
const productFormRef = ref<FormInstance>()
// 也不用担心写错成 prodcutCode
const productForm = reactive<ProductInfo>({
  productCode: '',
  productName: '',
  pricePurchase: 0,
  priceSale: 0,
  status: 1,
  // id 默认为 undefined，完美符合 ProductInfo 定义
})

// 👇 新增：导入弹窗控制变量
const importDialog = reactive({
    visible: false,
    loading: false,
    file: null as UploadFile | null
})

// 👇 新增：表单校验规则
const rules = {
    productName: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }]
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
        const res: any = await getProductListApi(queryParams)
        // 后端返回的是 IPage 对象，里面有 records 和 total
        productList.value = res.records
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
const handleSelectionChange = (selection: ProductInfo[]) => {
    selectedIds.value = selection.map(item => item.id as string)
}

// 页面加载完成后立即查询
onMounted(() => {
    getList()
})

// ✨ 新增按钮点击
const handleAdd = () => {
    resetForm()
    dialog.title = '新增商品'
    dialog.visible = true
}

// ✨ 导入按钮点击
const handleImport = () => {
    importDialog.visible = true
    importDialog.file = null
    // 清空上次上传的文件
    if (uploadRef.value) {
        uploadRef.value.clearFiles()
    }
}

// ✨ 文件选择变化
const handleFileChange = (uploadFile: UploadFile) => {
    importDialog.file = uploadFile
}

// ✨ 提交导入
const submitImport = async () => {
    if (!importDialog.file || !importDialog.file.raw) {
        ElMessage.warning('请选择要导入的Excel文件')
        return
    }
    
    importDialog.loading = true
    try {
        await importProductApi(importDialog.file.raw)
        ElMessage.success('导入成功')
        importDialog.visible = false
        getList() // 刷新列表
    } catch (error) {
        console.error('导入失败:', error)
    } finally {
        importDialog.loading = false
    }
}

// ✨ 编辑按钮点击
const handleEdit = (row: any) => {
    resetForm()
    dialog.title = '修改商品'
    dialog.visible = true
    // 数据回显：把行数据填入表单
    nextTick(() => {
        Object.assign(productForm, row)
    })
}

// ✨ 提交表单
const submitForm = async () => {
    if (!productFormRef.value) return
    await productFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (productForm.id) {
                    await updateProductApi(productForm)
                    ElMessage.success('修改成功')
                } else {
                    await addProductApi(productForm)
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
    const productIds = row?.id ? [row.id] : selectedIds.value
    if (productIds.length === 0) return

    ElMessageBox.confirm('确认要删除选中的商品吗？数据一旦删除无法恢复！', '警告', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        await deleteProductApi(productIds)
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
    productForm.id = undefined
    productForm.productCode = ''
    productForm.productName = ''
    productForm.priceSale = 0
    productForm.pricePurchase = 0
    productForm.unit = ''
    productForm.status = 1
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

.upload-demo {
    margin-bottom: 20px;
}
</style>