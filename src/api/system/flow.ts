import request from '../../utils/request'

// 获取我的待办任务列表
export const getMyTasksApi = () => {
  return request.get('/flow/tasks')
}

// 提交审批（完成任务）
export const completeTaskApi = (taskId: string) => {
  return request.post(`/flow/complete/${taskId}`)
}

// 辅助接口：通过采购单ID获取单据详情（回显用）
// 之前我们在 PurchaseOrderController 里应该写过 getDetail 了
import { getPurchaseOrderDetailApi } from '../../api/psi/purchase'
export { getPurchaseOrderDetailApi }