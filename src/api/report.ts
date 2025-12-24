import request from '../utils/request'

export const getDashboardApi = () => {
  return request.get('/report/dashboard')
}