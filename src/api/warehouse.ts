import request from '../utils/request'

export interface WarehouseInfo {
    id?: string
    code: string
    name: string
    location: string
    manager: string
    status: number
    remark?: string
}

export const getWarehouseListApi = (params: any) => request.get('/basic/warehouse/list', { params })
export const getWarehouseOptionsApi = () => request.get(`/basic/warehouse/options`)
export const addWarehouseApi = (data: WarehouseInfo) => request.post('/basic/warehouse/add', data)
export const updateWarehouseApi = (data: WarehouseInfo) => request.put('/basic/warehouse/edit', data)
export const deleteWarehouseApi = (ids: string[]) => request.delete(`/basic/warehouse/delete/${ids.join(',')}`)