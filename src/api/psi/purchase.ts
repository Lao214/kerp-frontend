import request from '../../utils/request'
import type { ProductInfo } from '../product'

// 采购单 DTO
export interface PurchaseOrderDTO {
  id?: string
  supplierId: string
  warehouseId: string
  orderDate: string
  remark?: string
  // 👇 重点：如果有 status 或 total 之类的，一定要加 ?
  status?: number 
  totalAmount?: number
  totalQuantity?: number
  
  items: PurchaseOrderItemDTO[]
}

// 采购单明细 DTO
export interface PurchaseOrderItemDTO {
  productId: string
  productCode?: string 
  productName?: string
  unit?: string
  quantity: number
  unitPrice: number
  totalPrice?: number 
  remark?: string
}

export interface Options {
    id?: string,
    label: string,
    value: string
}

// 提交采购单
export const addPurchaseOrderApi = (data: PurchaseOrderDTO) => {
    return request.post('/psi/purchase/add', data)
}

// 分页查询采购单
export const getPurchaseOrderListApi = (params: any) => {
  return request.get('/psi/purchase/list', { params })
}

// 审核采购单
export const auditPurchaseOrderApi = (id: string) => {
  return request.put(`/psi/purchase/audit/${id}`)
}

// --- 辅助接口 (为了偷懒，我们直接复用之前的 list 接口，size传大点) ---

// 获取所有供应商
import { getSupplierOptionsApi } from '../supplier' // 假设你有
// 获取所有仓库
import { getWarehouseOptionsApi } from '../warehouse' // 假设你有
// 获取所有商品 (带搜索)
import { getProductListApi } from '../product'

// 简单封装一个获取全部商品的函数 (实际场景应该用远程搜索)
export const getAllProductList = async () => {
    const res: any = await getProductListApi({ page: 1, size: 1000 })
    return res.records as ProductInfo[]
}

export const getSupplierOptions = async () => {
    const res: any = await getSupplierOptionsApi()
    return res as Options[]
}

export const getWarehouseOptions = async () => {
    const res: any = await getWarehouseOptionsApi()
    return res as Options[]
}

// 获取采购单详情
export const getPurchaseOrderDetailApi = (id: string) => {
  return request.get(`/psi/purchase/detail/${id}`)
}
