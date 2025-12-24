import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
    // 这里指向 vite.config.ts 里的代理配置
    baseURL: '/api',
    timeout: 20000 // 请求超时时间
})

// request 拦截器 (发送请求前做的事)
service.interceptors.request.use(
    (config) => {
        // TODO: 后面登录成功了，我们要在这里把 Token 塞进 Header
        const token = localStorage.getItem('kerp-token')
        // 如果有 token，就塞进 Header
        if (token) {
            // 注意：后端的 Sa-Token 或 Spring Security 通常需要 'Bearer ' 前缀
            // 但我们在后端生成 Token 时如果已经加了 Bearer，这里就不用加
            // 根据之前的代码，后端返回的是: "Bearer " + UUID
            // 所以这里直接传即可
            config.headers['Authorization'] = token
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// response 拦截器 (收到响应后做的事)
service.interceptors.response.use(
    (response) => {
        const res = response.data
        // 这里的 code === 200 对应我们后端 Result.java 里的代码
        if (res.code !== 200) {
            ElMessage.error(res.message || '系统错误')
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            return res.data // 直接返回后端 data 部分
        }
    },
    (error) => {
        console.error('err' + error)
        ElMessage.error(error.message || '网络异常')
        return Promise.reject(error)
    }
)

export default service