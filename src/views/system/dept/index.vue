<template>
    <div class="app-container">
        <el-card>
            <div style="margin-bottom: 20px">
                <el-button type="primary" icon="Plus" @click="handleAdd(0)">新增根部门</el-button>
            </div>

            <!-- 🔥 核心配置：row-key="id" 和 default-expand-all -->
            <el-table :data="deptList" row-key="id" border default-expand-all
                :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
                <el-table-column prop="deptName" label="部门名称" width="260" />
                <el-table-column prop="orderNum" label="排序" width="100" align="center" />
                <el-table-column prop="leader" label="负责人" align="center" width="150" />
                <el-table-column prop="status" label="状态" align="center" width="100">
                    <template #default="{ row }">
                        <el-tag v-if="row.status === 1" type="success">正常</el-tag>
                        <el-tag v-else type="danger">停用</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" align="center" />

                <el-table-column label="操作" align="center" width="250">
                    <template #default="{ row }">
                        <el-button link type="primary" icon="Edit">编辑</el-button>
                        <el-button link type="primary" icon="Plus" @click="handleAdd(row.id)">新增下级</el-button>
                        <el-button link type="danger" icon="Delete">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 新增/修改弹窗 -->
        <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px">
            <el-form :model="form" label-width="80px">
                <el-form-item label="上级部门">
                    <!-- 使用 TreeSelect 选择父节点 -->
                    <el-tree-select v-model="form.parentId" :data="deptList" :props="{ label: 'deptName', value: 'id' }"
                        check-strictly placeholder="选择上级部门" style="width: 100%" />
                </el-form-item>
                <el-form-item label="部门名称">
                    <el-input v-model="form.deptName" />
                </el-form-item>
                <el-form-item label="负责人">
                    <el-input v-model="form.leader" />
                </el-form-item>
                <el-form-item label="排序">
                    <el-input-number v-model="form.orderNum" :min="0" />
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
import { getDeptTreeApi, addDeptApi } from '../../../api/system/dept'
import { ElMessage } from 'element-plus'

const deptList = ref([])
const dialog = reactive({ visible: false, title: '' })
const form = reactive({
    id: undefined,
    parentId: 0,
    deptName: '',
    leader: '',
    orderNum: 0
})

const getList = async () => {
    const res: any = await getDeptTreeApi()
    deptList.value = res || []
}

const handleAdd = (parentId: number) => {
    form.id = undefined
    form.deptName = ''
    form.leader = ''
    form.orderNum = 0
    form.parentId = parentId
    dialog.title = '新增部门'
    dialog.visible = true
}

const handleSubmit = async () => {
    await addDeptApi(form)
    ElMessage.success('保存成功')
    dialog.visible = false
    getList()
}

onMounted(() => getList())
</script>