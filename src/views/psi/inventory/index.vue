<template>
    <div class="app-container">
        <el-card>
            <!-- 搜索栏 -->
            <el-form :inline="true" :model="queryParams">
                <el-form-item label="仓库">
                    <!-- 这里应该调用仓库API获取列表，我暂时写死做演示 -->
                    <el-select v-model="queryParams.warehouseId" placeholder="全部仓库" clearable style="width: 150px">
                        <el-option label="深圳主仓" value="2001" />
                        <el-option label="北京分仓" value="2002" />
                    </el-select>
                </el-form-item>
                <el-form-item label="商品">
                    <el-input v-model="queryParams.keyword" placeholder="商品名称/编码" clearable
                        @keyup.enter="handleQuery" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
                    <el-button icon="Refresh" @click="resetQuery">重置</el-button>
                </el-form-item>
            </el-form>

            <!-- 库存表格 -->
            <el-table v-loading="loading" :data="tableData" border stripe style="margin-top: 20px">
                <el-table-column label="序号" type="index" width="50" align="center" />
                <el-table-column label="仓库名称" prop="warehouseName" align="center" width="150" />
                <el-table-column label="商品编码" prop="productCode" align="center" width="120" />
                <el-table-column label="商品名称" prop="productName" align="center" />
                <el-table-column label="单位" prop="unit" align="center" width="80" />

                <el-table-column label="当前库存" prop="stockQuantity" align="center" width="150">
                    <template #default="{ row }">
                        <!-- 数量大于0显示绿色，等于0显示灰色 -->
                        <span v-if="row.stockQuantity > 0" style="color: #67C23A; font-weight: bold; font-size: 16px">
                            {{ row.stockQuantity }}
                        </span>
                        <span v-else style="color: #909399">0</span>
                    </template>
                </el-table-column>

                <el-table-column label="最后更新时间" prop="updateTime" align="center" width="180" />
            </el-table>

            <!-- 分页 -->
            <div style="margin-top: 20px; display: flex; justify-content: flex-end">
                <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.size"
                    :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                    @size-change="getList" @current-change="getList" />
            </div>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getInventoryListApi, type InventoryVO } from '../../../api/psi/inventory'

const loading = ref(false)
const tableData = ref<InventoryVO[]>([])
const total = ref(0)

const queryParams = reactive({
    page: 1,
    size: 10,
    keyword: '',
    warehouseId: undefined
})

const getList = async () => {
    loading.value = true
    try {
        const res: any = await getInventoryListApi(queryParams)
        tableData.value = res.records
        total.value = res.total
    } finally {
        loading.value = false
    }
}

const handleQuery = () => {
    queryParams.page = 1
    getList()
}

const resetQuery = () => {
    queryParams.keyword = ''
    queryParams.warehouseId = undefined
    handleQuery()
}

onMounted(() => {
    getList()
})
</script>