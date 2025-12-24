<template>
    <div class="login-container">
        <div class="login-box">
            <div class="title">K-ERP 企业管理系统</div>

            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="请输入账号" prefix-icon="User" />
                </el-form-item>

                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock"
                        show-password />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
                        立即登录
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import request from '../../utils/request'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user' // 👈 新增

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
// ... 变量定义保持不变
const userStore = useUserStore() // 👈 新增

// 表单数据
const loginForm = reactive({
    username: '',
    password: ''
})

// 验证规则
const loginRules = {
    username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 登录动作
const handleLogin = async () => {
    if (!loginFormRef.value) return

    await loginFormRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true

            // 👇 改成调用 Store 的 action
            const success = await userStore.login(loginForm)

            if (success) {
                ElMessage.success('登录成功，准备起飞！🚀')
                router.push('/') // 跳转到首页布局
            }
            // 失败的话 request 拦截器已经报错了，这里不管
            loading.value = false
        }
    })
}
</script>

<style scoped>
.login-container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #2d3a4b;
    /* 深色商务背景 */
}

.login-box {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.title {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
    color: #333;
}

.login-btn {
    width: 100%;
}
</style>