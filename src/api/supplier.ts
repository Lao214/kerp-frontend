import request from '../utils/request'

export interface SupplierInfo {
    id?: string
    code: string
    name: string
    contact: string
    phone: string
    email?: string,
    address?: string,
    payableBalance: number
    status: number
    remark?: string
}

export const getSupplierListApi = (params: any) => request.get('/basic/supplier/list', { params })
export const getSupplierOptionsApi = () => request.get(`/basic/supplier/options`)
export const addSupplierApi = (data: SupplierInfo) => request.post('/basic/supplier/add', data)
export const updateSupplierApi = (data: SupplierInfo) => request.put('/basic/supplier/edit', data)
export const deleteSupplierApi = (ids: string[]) => request.delete(`/basic/supplier/delete/${ids.join(',')}`)