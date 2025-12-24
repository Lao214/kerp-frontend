<template>
    <!-- 
    最外层包一个 div，ID 由父组件传入，或者固定
    这里我们只负责渲染内容，ID 在父组件调用时指定
  -->
    <div class="print-container">
        <!-- 标题 -->
        <h2 class="print-title">ERP 销售出库单</h2>

        <!-- 表头信息 -->
        <div class="print-header">
            <div class="info-item">单号：{{ data.orderNo }}</div>
            <div class="info-item">客户：{{ data.customerName }}</div>
            <div class="info-item">日期：{{ data.orderDate }}</div>
        </div>

        <!-- 明细表格 -->
        <table class="print-table">
            <thead>
                <tr>
                    <th style="width: 50px">序号</th>
                    <th>商品编码</th>
                    <th>商品名称</th>
                    <th>单位</th>
                    <th>数量</th>
                    <th>单价</th>
                    <th>金额</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in data.items" :key="index">
                    <td style="text-align: center">{{ index + 1 }}</td>
                    <td>{{ item.productCode }}</td>
                    <td>{{ item.productName }}</td>
                    <td style="text-align: center">{{ item.unit }}</td>
                    <td style="text-align: center">{{ item.quantity }}</td>
                    <td style="text-align: right">¥{{ item.unitPrice }}</td>
                    <td style="text-align: right">¥{{ item.totalPrice }}</td>
                </tr>
                <!-- 合计行 -->
                <tr class="total-row">
                    <td colspan="4" style="text-align: right; font-weight: bold">合计：</td>
                    <td style="text-align: center; font-weight: bold">{{ data.totalQuantity }}</td>
                    <td></td>
                    <td style="text-align: right; font-weight: bold">¥{{ data.totalAmount }}</td>
                </tr>
            </tbody>
        </table>

        <!-- 底部签字 -->
        <div class="print-footer">
            <div>制单人：{{ userName }}</div>
            <div>仓管员签字：________________</div>
            <div>客户签字：________________</div>
        </div>

        <div class="print-time">打印时间：{{ new Date().toLocaleString() }}</div>
    </div>
</template>

<script setup lang="ts">
// 定义接收的数据
defineProps<{
    data: any,      // 订单数据
    userName: string // 制单人名字
}>()
</script>

<style scoped>
/* 
  样式直接搬过来 
  注意：vue3-print-nb 会自动把 scoped 样式内联进去，不用担心
*/
@media print {
    .print-container {
        font-family: 'SimSun', '宋体', serif;
        padding: 20px;
        color: #000;
    }

    .print-title {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
    }

    .print-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 14px;
    }

    .print-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
        font-size: 12px;
    }

    .print-table th,
    .print-table td {
        border: 1px solid #000;
        padding: 6px 4px;
    }

    .print-footer {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        font-size: 14px;
    }

    .print-time {
        margin-top: 20px;
        text-align: right;
        font-size: 10px;
        color: #666;
    }
}
</style>