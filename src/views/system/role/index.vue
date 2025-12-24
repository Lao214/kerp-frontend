<template>
    <div class="app-container">
        <el-card>
            <div class="header-actions">
                <el-button type="primary" icon="Plus" @click="handleAdd">新增角色</el-button>
            </div>

            <el-table :data="tableData" border stripe v-loading="loading">
                <el-table-column label="序号" type="index" width="50" align="center" />
                <el-table-column label="角色名称" prop="roleName" align="center" />
                <el-table-column label="角色编码" prop="roleCode" align="center" />
                <el-table-column label="描述" prop="description" align="center" />
                <el-table-column label="创建时间" prop="createTime" align="center" width="180" />

                <el-table-column label="操作" align="center" width="250" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
                        <!-- 👇 核心按钮 -->
                        <el-button link type="success" icon="Menu" @click="handleMenu(row)">分配权限</el-button>
                        <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 👇 分配权限 Dialog -->
        <el-dialog title="分配菜单权限" v-model="permDialog.visible" width="600px">
            <el-form>
                <el-form-item label="当前角色">
                    <el-tag>{{ permDialog.roleName }}</el-tag>
                </el-form-item>
                <el-form-item label="菜单权限">
                    <!-- 仅在对话框打开且 menuTree 合法时才挂载 el-tree，防止 el-tree 在页面初始渲染时读取到非数组数据导致报错 -->
                    <div v-if="permDialog.visible">
                        <el-tree
                            v-if="isMenuTreeArray"
                            ref="menuTreeRef"
                            :data="menuTreeForTree"
                            :props="{ label: 'menuName', children: 'children' }"
                            show-checkbox node-key="id" default-expand-all highlight-current
                            style="width: 100%; border: 1px solid #dcdfe6; padding: 10px; border-radius: 4px;" />
                        <!-- 当 menuTree 无效时显示提示，便于调试 -->
                        <div v-else style="padding:10px;color:#999;">菜单数据尚未就绪或格式不正确</div>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="permDialog.visible = false">取 消</el-button>
                <el-button type="primary" @click="submitPerm" :loading="permDialog.loading">确 定</el-button>
            </template>
        </el-dialog>

        <!-- 4. 新增/修改 弹窗 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" @close="cancel">
            <el-form ref="roleFormRef" :model="roleForm" :rules="rules" label-width="80px">
                <el-form-item label="用户名" prop="rolename">
                    <!-- 修改时禁止改用户名，显得专业点 -->
                    <el-input v-model="roleForm.roleName" placeholder="请输入角色名" :disabled="!!roleForm.id" />
                </el-form-item>

                <el-form-item label="角色代码" prop="realCode">
                    <el-input v-model="roleForm.roleCode" placeholder="请输入角色代码" />
                </el-form-item>

                <el-form-item label="角色描述" prop="description">
                    <el-input v-model="roleForm.description" placeholder="请输入描述" />
                </el-form-item>

                <el-form-item label="数据权限" prop="dataScope">
                    <el-select v-model="roleForm.dataScope" placeholder="请选择数据范围">
                        <el-option label="全部数据" :value="1" />
                        <el-option label="本部门数据" :value="2" />
                        <el-option label="仅本人数据" :value="3" />
                    </el-select>
                    <div style="font-size: 12px; color: #999; margin-top: 5px;">
                        ⚠️ 提示：<br/>
                        全部数据：能看到所有人的单据。<br/>
                        本部门：能看到同部门同事的单据。<br/>
                        仅本人：只能看到自己创建的单据。
                    </div>
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
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage, type ElTree, ElMessageBox, type FormInstance } from 'element-plus'
import { getRoleListApi, getMenuTreeApi, getRoleMenuIdsApi, assignRoleMenuApi, updateRoleApi, addRoleApi, deleteRoleApi } from '../../../api/system/role'

// 1. 新增一个变量控制父子关联
const checkStrictly = ref(true)

// --- 列表数据 ---
const loading = ref(false)
const tableData = ref([])

// --- 权限分配相关 ---
const menuTree = ref<any[]>([])  // 菜单树数据，明确初始化为数组
const menuTreeRef = ref<InstanceType<typeof ElTree>>() // Tree 组件实例
const permDialog = reactive({
    visible: false,
    loading: false,
    roleId: '',
    roleName: ''
})

// 方便在模板/逻辑里判断 menuTree 是否为数组
const isMenuTreeArray = computed(() => Array.isArray(menuTree.value))
// 兜底数据，传给 el-tree 时保证一定是数组
const menuTreeForTree = computed(() => (Array.isArray(menuTree.value) ? menuTree.value : []))

// 获取角色列表
const getList = async () => {
    loading.value = true
    try {
        const res: any = await getRoleListApi()
        tableData.value = res.records  // 假设后端返回 list，如果是 Page 记得取 records
        console.log(tableData.value)
    } catch (err) {
        console.error('获取角色列表失败', err)
    } finally {
        loading.value = false
    }
}

// 👇 新增：弹窗控制变量
const dialog = reactive({
    title: '',
    visible: false
})

// 👇 新增：表单引用和数据
const roleFormRef = ref<FormInstance>()
const roleForm = reactive({
    id: undefined,
    roleName: '',
    roleCode: '',
    description: undefined,
    dataScope: 3, // 默认仅本人，安全第一
})

// 👇 新增：表单校验规则
const rules = {
    roleName: [{ required: true, message: '角色名不能为空', trigger: 'blur' }],
    roleCode: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }]
}

// 弹窗关闭时重置表单
const cancel = () => {
    dialog.visible = false
    resetForm()
}

const resetForm = () => {
    roleForm.id = undefined
    roleForm.roleName = ''
    roleForm.roleCode = ''
    roleForm.description = undefined
    roleForm.dataScope = 3
}

// 模拟新增
const handleAdd = () => {  
    resetForm()
    dialog.title = '新增角色'
    dialog.visible = true
}

// ✨ 编辑按钮点击
const handleEdit = (row: any) => {
    resetForm()
    dialog.title = '修改角色'
    dialog.visible = true
    // 数据回显：把行数据填入表单
    nextTick(() => {
        console.log(row)
       Object.assign(roleForm, {
            ...row,
            dataScope: row.dataScope != null ? Number(row.dataScope) : undefined
        })
    })
}

// ✨ 提交表单
const submitForm = async () => {
    if (!roleFormRef.value) return
    await roleFormRef.value.validate(async (valid) => {
        if (valid) {
            try {
                if (roleForm.id) {
                    await updateRoleApi(roleForm)
                    ElMessage.success('修改成功')
                } else {
                    await addRoleApi(roleForm)
                    ElMessage.success('新增成功')
                }
                dialog.visible = false
                getList() // 刷新列表
            } catch (error) {
                // 错误被拦截器捕获了
            }
        }
    })
}

// 🔥 打开分配权限弹窗
const handleMenu = async (row: any) => {
    permDialog.roleId = row.id
    permDialog.roleName = row.roleName
    permDialog.visible = true
    permDialog.loading = true

    try {
        // 1. 获取菜单树（只有第一次为空时请求）
        if (!Array.isArray(menuTree.value) || menuTree.value.length === 0) {
            try {
                const treeRes: any = await getMenuTreeApi()
                console.log('🔥 菜单树返回数据:', treeRes)

                menuTree.value = treeRes || []

            } catch (err) {
                console.error('获取菜单树失败：', err)
                menuTree.value = []
            }
        }

        // 2. 获取该角色已有的菜单ID
        const idsRes: any = await getRoleMenuIdsApi(row.id)
        const checkedIds = (idsRes || []) as string[]


        // 3. 回显勾选状态
        nextTick(() => {

            const leafKeys: string[] = []

            const checkLeaf = (nodes: any[]) => {
                (nodes || []).forEach(node => {
                    if (!node.children || node.children.length === 0) {
                        if (checkedIds.includes(node.id)) {
                            leafKeys.push(node.id)
                        }
                    } else {
                        checkLeaf(node.children)
                    }
                })
            }

            checkLeaf(menuTree.value)

            menuTreeRef.value?.setCheckedKeys(leafKeys)
            
        })

    } finally {
        permDialog.loading = false
    }
}

// 🔥 提交权限
const submitPerm = async () => {
    if (!menuTreeRef.value) return
    permDialog.loading = true

    try {
        const checkedKeys = menuTreeRef.value.getCheckedKeys()
        const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
        const finalIds = [...checkedKeys, ...halfCheckedKeys]

        await assignRoleMenuApi({
            roleId: permDialog.roleId,
            menuIds: finalIds as string[]
        })

        ElMessage.success('权限分配成功！')
        permDialog.visible = false
    } finally {
        permDialog.loading = false
    }
}

// ✨ 删除按钮点击 (支持单删和批量删)
const handleDelete = (row?: any) => {
    const userIds = row?.id 
    if (userIds.length === 0) return

    ElMessageBox.confirm('确认要删除选中的角色吗？数据一旦删除无法恢复！', '警告', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        await deleteRoleApi(userIds)
        ElMessage.success('删除成功')
        getList() // 刷新列表
    })
}

onMounted(() => {
    // 为了调试，页面初始也打印一次 menuTree 的值，确认不是别处覆盖
    console.log('页面 mounted: 初始 menuTree =', menuTree.value)
    getList()
})
</script>

<style scoped>
.header-actions {
    margin-bottom: 20px;
}
</style>
