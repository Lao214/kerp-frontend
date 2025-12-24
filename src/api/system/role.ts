import request from '../../utils/request'

// 获取角色列表
export const getRoleListApi = (params?: any) => request.get('/system/role/list', { params })
export const getRoleOptionsApi = () => request.get('/system/role/list/options') // 不分页

// 获取角色已有的菜单ID
export const getRoleMenuIdsApi = (roleId: string) => request.get(`/system/role/menus/${roleId}`)

// 获取菜单树
export const getMenuTreeApi = () => request.get('/system/menu/tree')

// 新增角色
export const addRoleApi = (data: any) => {
  return request.post('/system/role/add', data)
}

// 修改用户
export const updateRoleApi = (data: any) => {
  return request.put('/system/role/edit', data)
}

// 删除用户 (支持批量)
export const deleteRoleApi = (ids: string[]) => {
  // join(',') 把数组变成字符串: 1,2,3
  return request.delete(`/system/user/delete/${ids.join(',')}`)
}

// 分配权限
export const assignRoleMenuApi = (data: { roleId: string; menuIds: string[] }) => {
  return request.post('/system/role/assignMenu', data)
}