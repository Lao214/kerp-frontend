import request from '../utils/request'

// 定义一下接口返回的数据结构 (TypeScript 强类型优势)
export interface UserInfo {
    id: string
    username: string
    realName: string
    avatar: string
    status: number
    createTime: string
}

// 查询列表的参数接口
export interface UserQuery {
    page: number
    size: number
    username?: string
}

// 获取用户列表
export const getUserListApi = (params: UserQuery) => {
    return request.get('/system/user/list', { params })
}

// 新增用户
export const addUserApi = (data: any) => {
  return request.post('/system/user/add', data)
}

// 修改用户
export const updateUserApi = (data: any) => {
  return request.put('/system/user/edit', data)
}

// 删除用户 (支持批量)
export const deleteUserApi = (ids: string[]) => {
  // join(',') 把数组变成字符串: 1,2,3
  return request.delete(`/system/user/delete/${ids.join(',')}`)
}

// 获取用户已有的角色ID
export const getUserRoleIdsApi = (userId: string) => {
  return request.get(`/system/user/roles/${userId}`)
}

// 分配角色
export const assignUserRoleApi = (data: { userId: string; roleIds: string[] }) => {
  return request.post('/system/user/assignRole', data)
}