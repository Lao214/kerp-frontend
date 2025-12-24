import request from '../../utils/request'

export interface ReceiptInfo {
  id?: string
  receiptNo?: string
  customerId: string
  receiptDate: string
  amount: number
  paymentMethod: string
  status?: number
  remark?: string
}

export const getReceiptListApi = (params: any) => request.get('/finance/receipt/list', { params })
export const addReceiptApi = (data: ReceiptInfo) => request.post('/finance/receipt/add', data)
export const auditReceiptApi = (id: string) => request.put(`/finance/receipt/audit/${id}`)
export const deleteReceiptApi = (ids: string[]) => request.delete(`/finance/receipt/delete/${ids.join(',')}`)