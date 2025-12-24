import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

// 🔑 定义常量，以后改名字只改这里
const TOKEN_KEY = 'kerp-token'


export const useUserStore = defineStore('user', () => {
  // 1. State: 刚进来时，先去 localStorage 找找有没有 'kerp-token'
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const username = ref('')
  // 👇 新增：存储权限列表
  // ⚡️ 重点看这里：一定要初始化为 []，不能空着！
  const permissions = ref<string[]>([])

   // ✨ 新增：标记用户信息是否已加载
  const isUserInfoLoaded = ref(false)

  // 2. Action: 登录
  const login = async (loginForm: any) => {
    try {
      const res = await request.post('/auth/login', loginForm)
      
      // 后端返回的 token 字符串
      const tokenStr = res as unknown as string
      token.value = tokenStr
      
      // 💾 持久化存储：使用新的 Key
      localStorage.setItem(TOKEN_KEY, tokenStr)
      await getUserInfo()
      return true
    } catch (error) {
      return false
    }
  }

  // 3. Action: 退出
  const logout = () => {
    token.value = ''
    username.value = ''
    permissions.value = [] // 👈 清空
    // 🗑️ 删除时也用新的 Key
    localStorage.removeItem(TOKEN_KEY)
  }


  // 👇 新增：4. 获取用户信息 action
  const getUserInfo = async () => {
      try {
        const res: any = await request.get('/auth/info')
        permissions.value = res.permissions || []
        console.log('用户信息', res)
      } finally {
        // ✨ 无论成功失败，或者权限为空，都标记为“已加载”
        // 这样路由守卫就不会死循环了
        isUserInfoLoaded.value = true
      }
  }

  return { token, username, login, logout, getUserInfo, permissions, isUserInfoLoaded }
})