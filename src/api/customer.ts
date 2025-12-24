import request from '../utils/request'

export interface CustomerInfo {
    id?: string
    code: string
    name: string
    contact: string
    phone: string
    email?: string,
    address?: string,
    receivableBalance: number
    status: number
    remark?: string
}

export const getCustomerListApi = (params: any) => request.get('/basic/customer/list', { params })
export const getCustomerOptionsApi = () => request.get(`/basic/customer/options`)
export const addCustomerApi = (data: CustomerInfo) => request.post('/basic/customer/add', data)
export const updateCustomerApi = (data: CustomerInfo) => request.put('/basic/customer/edit', data)
export const deleteCustomerApi = (ids: string[]) => request.delete(`/basic/customer/delete/${ids.join(',')}`)