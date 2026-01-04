import request from '../../utils/request'


// 采购单 DTO
export interface SalesReturnDTO {
  id?: string
  returnNo?: string
  sourceOrderNo: string
  customerId: string
  warehouseId: string
  returnDate: string
  remark?: string
  // 👇 重点：如果有 status 或 total 之类的，一定要加 ?
  status?: number 
  totalAmount?: number
  totalQuantity?: number
  
  items: SalesReturnItemDTO[]
}

// 采购单明细 DTO
export interface SalesReturnItemDTO {
  productId: string
  productCode?: string 
  productName?: string
  unit?: string
  quantity: number
  maxQuantity?: number
  unitPrice: number
  totalPrice?: number 
  remark?: string
  // 🔥 新增 WMS 字段
  manageType?: number // 前端辅助字段，用于判断显示什么输入框
  batchNo?: string
  expireDate?: string
  sourceSnList? : string[]
  snList?: string[]   // 序列号列表
}

export const getSalesReturnListApi = (params: any) => {
  return request.get('/psi/salesReturn/list', { params })
}

// 提交采购单
export const addSalesReturnApi = (data: SalesReturnDTO) => {
    return request.post('/psi/salesReturn/add', data)
}

// 审核采购单
export const auditSalesReturnApi = (id: string) => {
  return request.put(`/psi/salesReturn/audit/${id}`)
}

export const deleteSalesReturnApi = (ids: string[]) => request.delete(`/psi/salesReturn/delete/${ids.join(',')}`)