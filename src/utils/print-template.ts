// 一个简单的 A4 纸销售单模板
export const salesOrderTemplate = {
    panels: [
        {
            index: 0,
            paperType: 'A4',
            height: 297,
            width: 210,
            paperHeader: 49.5,
            paperFooter: 780,
            printElements: [
                // 1. 标题
                {
                    options: { left: 175.5, top: 10.5, height: 27, width: 259, title: 'ERP 销售出库单', fontSize: 19, fontWeight: "bold", textAlign: "center" },
                    printElementType: { title: '文本', type: 'text' }
                },
                // 2. 单号 (绑定字段: orderNo)
                {
                    options: { left: 60, top: 57, height: 16, width: 200, field: 'orderNo', testData: 'SO20231129001' },
                    printElementType: { title: '单号', type: 'text' }
                },
                {
                    options: { left: 15, top: 57, height: 16, width: 50, title: '单号:' },
                    printElementType: { title: '文本', type: 'text' }
                },
                // 3. 客户 (绑定字段: customerName)
                {
                    options: { left: 60, top: 80, height: 16, width: 200, field: 'customerName', testData: '华为技术有限公司' },
                    printElementType: { title: '客户', type: 'text' }
                },
                {
                    options: { left: 15, top: 80, height: 16, width: 50, title: '客户:' },
                    printElementType: { title: '文本', type: 'text' }
                },
                // 4. 明细表格 (绑定字段: details)
                {
                    options: {
                        left: 15, top: 110, height: 56, width: 511.5,
                        field: 'details', // 数据源 Key
                        table: {           // ✅ 必须有 table
                            autoWidth: false, // 🔥 关键
                            columns: [       // ✅ columns 在这里
                                { title: '商品编码', field: 'productCode', width: 100 },
                                { title: '商品名称', field: 'productName', width: 150 },
                                { title: '单位', field: 'unit', width: 50 },
                                { title: '数量', field: 'quantity', width: 60 },
                                { title: '单价', field: 'unitPrice', width: 70 },
                                { title: '金额', field: 'totalPrice', width: 80 }
                            ]
                        }
                    },
                    printElementType: { title: '订单明细表', type: 'table' }
                },
                // 5. 底部合计
                {
                    options: { left: 15, top: 200, height: 16, width: 200, title: '制单人：Admin', fontSize: 12 },
                    printElementType: { title: '文本', type: 'text' }
                }
            ]
        }
    ]
}