import request from '../../utils/request'

export interface PaymentInfo {
  id?: string
  paymentNo?: string
  supplierId: string
  paymentDate: string
  amount: number
  paymentMethod: string
  status?: number
  remark?: string
}

export const getPaymentListApi = (params: any) => request.get('/finance/payment/list', { params })
export const addPaymentApi = (data: PaymentInfo) => request.post('/finance/payment/add', data)
export const auditPaymentApi = (id: string) => request.put(`/finance/payment/audit/${id}`)
export const deletePaymentApi = (ids: string[]) => request.delete(`/finance/payment/delete/${ids.join(',')}`)