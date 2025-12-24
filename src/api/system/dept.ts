import request from '../../utils/request'

export const getDeptTreeApi = () => request.get('/system/dept/list')
export const addDeptApi = (data: any) => request.post('/system/dept/add', data)
// ... update, delete