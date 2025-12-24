<template>
    <div class="app-container">
        <!-- 1. 搜索与操作栏 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="queryParams">
                <el-form-item label="用户名">
                    <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
            </el-form>

            <!-- 新增按钮栏 -->
            <div class="operation-bar">
                <!-- 新增按钮 -->
                <el-button type="primary" icon="Plus" plain @click="handleAdd"
                    v-permission="['system:user:add']">新增用户</el-button>

                <!-- 批量删除按钮 -->
                <el-button type="danger" icon="Delete" plain :disabled="selectedIds.length === 0"
                    @click="handleDelete">批量删除</el-button>
            </div>
        </el-card>

        <!-- 2. 数据表格 -->
        <el-card class="table-card">
            <el-table v-loading="loading" :data="userList" border stripe @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="序号" type="index" width="60" align="center" />
                <el-table-column label="用户名" prop="username" align="center" />
                <el-table-column label="真实姓名" prop="realName" align="center" />

                <el-table-column label="状态" align="center">
                    <template #default="scope">
                        <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
                        <el-tag v-else type="danger">禁用</el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="创建时间" prop="createTime" align="center" width="180" />

                <el-table-column label="操作" align="center" width="200" fixed="right">
                    <!-- 表格里的操作列 -->
                    <template #default="{ row }">
                        <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
                        <!-- 👇 新增：分配角色按钮 -->
                        <el-button link type="warning" icon="UserFilled" @click="handleRole(row)">分配角色</el-button>
                        <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
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
            <el-form ref="userFormRef" :model="userForm" :rules="rules" label-width="80px">
                <el-form-item label="用户名" prop="username">
                    <!-- 修改时禁止改用户名，显得专业点 -->
                    <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="!!userForm.id" />
                </el-form-item>

                <el-form-item label="真实姓名" prop="realName">
                    <el-input v-model="userForm.realName" placeholder="请输入真实姓名" />
                </el-form-item>

                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="userForm.status">
                        <el-radio :label="1">正常</el-radio>
                        <el-radio :label="0">禁用</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!-- 之前是 el-input，现在改成这个 -->
                <el-form-item label="归属部门" prop="deptId">
                    <el-tree-select v-model="userForm.deptId" :data="deptOptions" :props="{ label: 'deptName', value: 'id', children: 'children' }"
                        value-key="id" placeholder="请选择归属部门" check-strictly filterable style="width: 100%"
                    />
                </el-form-item>

            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancel">取 消</el-button>
                    <el-button type="primary" @click="submitForm">确 定</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 👇 新增：分配角色 Dialog -->
        <el-dialog title="分配角色" v-model="roleDialog.visible" width="500px">
            <el-form label-width="80px">
                <el-form-item label="用户名">
                    <el-input v-model="roleDialog.username" disabled />
                </el-form-item>
                <el-form-item label="角色选择">
                    <el-checkbox-group v-model="roleDialog.selectedRoleIds">
                        <el-checkbox v-for="role in roleList" :key="role.id" :label="role.id">
                            {{ role.roleName }}
                        </el-checkbox>
                    </el-checkbox-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="roleDialog.visible = false">取 消</el-button>
                <el-button type="primary" @click="submitRole" :loading="roleDialog.loading">确 定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
// 👇 引入新增的 API
import { getUserListApi, addUserApi, updateUserApi, deleteUserApi, getUserRoleIdsApi, assignUserRoleApi, type UserInfo } from '../../../api/user'
import { getRoleOptionsApi } from '../../../api/system/role'
import { getDeptTreeApi } from '../../../api/system/dept'
// 变量定义
const loading = ref(false)
const userList = ref<UserInfo[]>([])
const total = ref(0)
const selectedIds = ref<string[]>([])
const deptOptions = ref([])

// 查询参数
const queryParams = reactive({
    page: 1,
    size: 10,
    username: ''
})

// 👇 新增：表单引用和数据
const userFormRef = ref<FormInstance>()
const userForm = reactive({
    id: undefined,
    username: '',
    realName: '',
    status: 1,
    deptId: undefined
})

// 👇 新增：表单校验规则
const rules = {
    username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
    realName: [{ required: true, message: '真实姓名不能为空', trigger: 'blur' }]
}

// 👇 新增：弹窗控制变量
const dialog = reactive({
    title: '',
    visible: false
})

// --- 角色分配相关变量 ---
const roleList = ref<any[]>([]) // 所有可选角色
const roleDialog = reactive({
    visible: false,
    loading: false,
    userId: '',
    username: '',
    selectedRoleIds: [] as string[]
})

// 方法：获取列表数据
const getList = async () => {
    loading.value = true
    try {
        const res: any = await getUserListApi(queryParams)
        // 后端返回的是 IPage 对象，里面有 records 和 total
        userList.value = res.records
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
    queryParams.username = ''
    queryParams.page = 1
    getList()
}

// 多选框选中
const handleSelectionChange = (selection: UserInfo[]) => {
    selectedIds.value = selection.map(item => item.id)
}

// 页面加载完成后立即查询
onMounted(() => {
    getList()
})

// ✨ 新增按钮点击
const handleAdd = async () => {
    resetForm()
    const res: any = await getDeptTreeApi()
    deptOptions.value = res || []
    dialog.title = '新增用户'
    dialog.visible = true
}

// ✨ 编辑按钮点击
const handleEdit = async (row: any) => {
    resetForm()
    const res: any = await getDeptTreeApi()
    deptOptions.value = res || []
    dialog.title = '修改用户'
    dialog.visible = true
    // 数据回显：把行数据填入表单
    nextTick(() => {
        Object.assign(userForm, row)
    })
}

// ✨ 提交表单
const submitForm = async () => {
    if (!userFormRef.value) return
    await userFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (userForm.id) {
                    await updateUserApi(userForm)
                    ElMessage.success('修改成功')
                } else {
                    await addUserApi(userForm)
                    ElMessage.success('新增成功，默认密码 123456')
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
    const userIds = row?.id ? [row.id] : selectedIds.value
    if (userIds.length === 0) return

    ElMessageBox.confirm('确认要删除选中的用户吗？数据一旦删除无法恢复！', '警告', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        await deleteUserApi(userIds)
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
    userForm.id = undefined
    userForm.username = ''
    userForm.realName = ''
    userForm.status = 1
    userForm.deptId = undefined
}

// --- 打开分配角色弹窗 ---
const handleRole = async (row: any) => {
    roleDialog.userId = row.id
    roleDialog.username = row.username
    roleDialog.visible = true
    roleDialog.loading = true

    try {
        // 1. 并行请求：获取所有角色 + 获取当前用户已有角色
        // Promise.all 能加快速度
        const [allRolesRes, userRolesRes] = await Promise.all([
            getRoleOptionsApi(),
            getUserRoleIdsApi(row.id)
        ])

        roleList.value = allRolesRes as any
        roleDialog.selectedRoleIds = userRolesRes as any
    } finally {
        roleDialog.loading = false
    }
}

// --- 提交分配角色 ---
const submitRole = async () => {
    roleDialog.loading = true
    try {
        await assignUserRoleApi({
            userId: roleDialog.userId,
            roleIds: roleDialog.selectedRoleIds
        })
        ElMessage.success('角色分配成功，用户重新登录后生效！')
        roleDialog.visible = false
    } finally {
        roleDialog.loading = false
    }
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