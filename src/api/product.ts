import request from '../utils/request'

export interface ProductInfo {
    id?: string
    productCode: string
    productName: string
    category?: string
    unit?: string
    pricePurchase: number
    priceSale: number
    status: number
    remark?: string
    manageType: number // 0:普通 1:批次 2:序列号
}

export const getProductListApi = (params: any) => request.get('/basic/product/list', { params })
export const addProductApi = (data: ProductInfo) => request.post('/basic/product/add', data)
export const updateProductApi = (data: ProductInfo) => request.put('/basic/product/edit', data)
export const deleteProductApi = (ids: string[]) => request.delete(`/basic/product/delete/${ids.join(',')}`)
export const importProductApi = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/basic/product/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}