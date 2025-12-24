import request from '../../utils/request'

export interface InventoryVO {
    id: string
    warehouseName: string
    productCode: string
    productName: string
    unit: string
    stockQuantity: number
    updateTime: string
}

export const getInventoryListApi = (params: any) => {
    return request.get('/psi/inventory/list', { params })
}