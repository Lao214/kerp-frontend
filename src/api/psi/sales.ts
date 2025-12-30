import request from '../../utils/request'
import type { ProductInfo } from '../product'

// 采购单 DTO
export interface SalesOrderDTO {
  id?: string
  customerId: string
  warehouseId: string
  orderDate: string
  remark?: string
  // 👇 重点：如果有 status 或 total 之类的，一定要加 ?
  status?: number
  totalAmount?: number
  totalQuantity?: number

  items: SalesOrderItemDTO[]
}

// 采购单明细 DTO
export interface SalesOrderItemDTO {
  productId: string
  productCode?: string
  productName?: string
  unit?: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  remark?: string
  manageType?: number // 前端辅助字段，用于判断显示什么输入框
  batchNo?: string
  snList?: string[]   // 序列号列表
  expireDate?: string
}

export interface SalesOrderDetail {
    orderNo: string
    customerName?: string
    orderDate: string
    totalQuantity: number
    totalAmount: number
    items: any[]
}


export interface Options {
  id?: string,
  label: string,
  value: string
}

// 提交采购单
export const addSalesOrderApi = (data: SalesOrderDTO) => {
  return request.post('/psi/sales/add', data)
}

// 分页查询采购单
export const getSalesOrderListApi = (params: any) => {
  return request.get('/psi/sales/list', { params })
}

// 审核采购单
export const auditSalesOrderApi = (id: string) => {
  return request.put(`/psi/sales/audit/${id}`)
}

// --- 辅助接口 (为了偷懒，我们直接复用之前的 list 接口，size传大点) ---

// 获取所有供应商
import { getCustomerOptionsApi } from '../customer' // 假设你有
// 获取所有仓库
import { getWarehouseOptionsApi } from '../warehouse' // 假设你有
// 获取所有商品 (带搜索)
import { getProductListApi } from '../product'

// 简单封装一个获取全部商品的函数 (实际场景应该用远程搜索)
export const getAllProductList = async () => {
  const res: any = await getProductListApi({ page: 1, size: 1000 })
  return res.records as ProductInfo[]
}

export const getCustomerOptions = async () => {
  const res: any = await getCustomerOptionsApi()
  return res as Options[]
}

export const getWarehouseOptions = async () => {
  const res: any = await getWarehouseOptionsApi()
  return res as Options[]
}

export const getSalesOrderDetailApi = (id: string) => {
  return request.get<SalesOrderDetail>(`/psi/sales/detail/${id}`)
}