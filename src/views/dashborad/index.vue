<template>
    <div class="dashboard-container">
        <!-- 1. 顶部数据卡片 -->
        <el-row :gutter="20">
            <el-col :span="6">
                <el-card shadow="hover">
                    <el-statistic title="今日销售额" :value="data.todaySales" precision="2" prefix="¥">
                        <template #suffix><el-icon style="color:red">
                                <Top />
                            </el-icon></template>
                    </el-statistic>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <el-statistic title="今日采购支出" :value="data.todayPurchase" precision="2" prefix="¥">
                        <template #suffix><el-icon style="color:green">
                                <Bottom />
                            </el-icon></template>
                    </el-statistic>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <el-statistic title="当前库存总数" :value="data.totalStock">
                        <template #suffix><el-icon>
                                <Box />
                            </el-icon></template>
                    </el-statistic>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <el-statistic title="累计销售总额" :value="data.totalSales" precision="2" prefix="¥" />
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <!-- 颜色用金色 #E6A23C -->
                    <el-statistic title="净毛利" :value="data.profit" precision="2" prefix="¥" :value-style="{ color: '#E6A23C' }">
                    <template #suffix><el-icon><Coin /></el-icon></template>
                    </el-statistic>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <!-- 颜色用金色 #E6A23C -->
                    <el-statistic title="今日净毛利" :value="data.todayProfit" precision="2" prefix="¥" :value-style="{ color: '#E6A23C' }">
                    <template #suffix><el-icon><Coin /></el-icon></template>
                    </el-statistic>
                </el-card>
            </el-col>
        </el-row>

        <!-- 2. 中间折线图 -->
        <el-card shadow="hover" style="margin-top: 20px;">
            <template #header>
                <div class="chart-header">
                    <span>近7天 采销趋势图</span>
                    <el-tag>实时数据</el-tag>
                </div>
            </template>
            <!-- ECharts 容器，必须给高度 -->
            <div ref="chartRef" style="width: 100%; height: 400px;"></div>
        </el-card>

        <!-- <img src="../../assets/生成祝福2026.png" width="300px" alt=""> -->
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDashboardApi } from '../../api/report'
import { da } from 'element-plus/es/locales.mjs'

// 响应式数据
const data = reactive({
    todaySales: 0,
    todayPurchase: 0,
    totalStock: 0,
    totalSales: 0,
    todayProfit: 0,
    profit: 0
})

const chartRef = ref(null)

// 初始化图表
const initChart = (dates: string[], sales: number[], purchase: number[]) => {
    const myChart = echarts.init(chartRef.value)

    const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['销售额', '采购额'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates
        },
        yAxis: { type: 'value' },
        series: [
            {
                name: '销售额',
                type: 'line',
                smooth: true, // 平滑曲线
                data: sales,
                itemStyle: { color: '#F56C6C' },
                areaStyle: { color: 'rgba(245, 108, 108, 0.1)' }
            },
            {
                name: '采购额',
                type: 'line',
                smooth: true,
                data: purchase,
                itemStyle: { color: '#409EFF' },
                areaStyle: { color: 'rgba(64, 158, 255, 0.1)' }
            }
        ]
    }

    myChart.setOption(option)

    // 窗口大小改变时自动重绘
    window.addEventListener('resize', () => {
        myChart.resize()
    })
}

// 加载数据
onMounted(async () => {
    const res: any = await getDashboardApi()
    console.log(res)

    // 填充大数字
    data.todaySales = res.todaySales
    data.todayPurchase = res.todayPurchase
    data.totalStock = res.totalStock
    data.totalSales = res.totalSales
    data.todayProfit = res.todayProfit
    data.profit = res.profit

    // 渲染图表 (等 DOM 更新后)
    nextTick(() => {
        if (chartRef.value) {
            initChart(res.dates, res.salesTrend, res.purchaseTrend)
        }
    })
})
</script>

<style scoped>
.dashboard-container {
    padding: 20px;
    background-color: #f0f2f5;
    min-height: calc(100vh - 84px);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
}
</style>