<template>
    <el-container class="app-wrapper">
        <!-- 左侧侧边栏 -->
        <el-aside width="200px" class="sidebar-container">
            <div class="logo">K-ERP 系统</div>

            <el-menu active-text-color="#409EFF" background-color="#304156" text-color="#bfcbd9"
                :default-active="$route.path" router>
                <!-- ♻️ 动态渲染菜单 -->
                <template v-for="menu in visibleMenuList" :key="menu.path">

                    <!-- 情况1：如果有子菜单 (SubMenu) -->
                    <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
                        <template #title>
                            <el-icon v-if="menu.icon">
                                <component :is="menu.icon" />
                            </el-icon>
                            <span>{{ menu.title }}</span>
                        </template>

                        <!-- 循环渲染子菜单 -->
                        <el-menu-item v-for="child in menu.children" :key="child.path" :index="child.path">
                            {{ child.title }}
                        </el-menu-item>
                    </el-sub-menu>

                    <!-- 情况2：如果没有子菜单，是单个菜单 (Item) -->
                    <el-menu-item v-else :index="menu.path">
                        <el-icon v-if="menu.icon">
                            <component :is="menu.icon" />
                        </el-icon>
                        <span>{{ menu.title }}</span>
                    </el-menu-item>

                </template>
            </el-menu>
        </el-aside>

        <!-- 右侧主体 (保持不变) -->
        <el-container>
            <el-header class="header-container">
                <div class="header-left">
                    <!-- 这里可以加个收缩按钮 -->
                    <el-icon class="collapse-btn">
                        <Fold />
                    </el-icon>
                    <span style="margin-left: 10px">欢迎进入K-Erp企业资源管理系统</span>
                </div>
                <div class="header-right">
                    <el-badge :value="todoCount" :hidden="todoCount === 0" class="item" style="margin-right: 20px; cursor: pointer;">
                        <el-icon :size="20" @click="$router.push('/system/todo')"><Bell /></el-icon>
                    </el-badge>
                    <el-dropdown @command="handleCommand">
                        <span class="el-dropdown-link">
                            {{ userStore.username || '管理员' }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>

            <el-main>
                <router-view />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { getMyTasksApi } from '../api/system/flow'

const router = useRouter()
const userStore = useUserStore()

const todoCount = ref(0)

// 📝 1. 定义菜单结构 (数据驱动视图)
// perm: 对应数据库 sys_menu 表里的 perms 字段
// 如果 perm 为空，表示该菜单所有人可见 (如 Dashboard)
const allMenus = [
    {
        path: '/dashboard',
        title: '首页仪表盘',
        icon: 'Odometer',
        perm: '' // 公开
    },
    {
        path: '/system',
        title: '系统管理',
        icon: 'Setting',
        perm: '', // 父级菜单一般不设强权限，看子级
        children: [
            { path: '/system/user', title: '用户管理', perm: 'system:user:list' },
            { path: '/system/role', title: '角色管理', perm: 'system:role:list' },
            { path: '/system/dept', title: '部门管理', perm: 'system:dept:list' }, // 假设你有这个权限码
            { path: '/system/todo', title: '待办事项', perm: 'workflow:todo:list' } // 假设你有这个权限码
        ]
    },
    {
        path: '/basic',
        title: '基础管理',
        icon: 'Box',
        children: [
            { path: '/basic/product', title: '商品管理', perm: 'base:product:list' },
            { path: '/basic/supplier', title: '供应商管理', perm: 'base:supplier:list' },
            { path: '/basic/customer', title: '客户管理', perm: 'base:customer:list' },
            { path: '/basic/warehouse', title: '仓库管理', perm: 'base:warehouse:list' }
        ]
    },
    {
        path: '/psi',
        title: '采购销售',
        icon: 'ShoppingCart',
        children: [
            { path: '/psi/purchase', title: '采购单管理', perm: 'psi:purchase:list' },
            { path: '/psi/sales', title: '销售单管理', perm: 'psi:sales:list' },
            { path: '/psi/inventory', title: '库存查询', perm: 'psi:inventory:list' }
        ]
    },
    {
        path: '/finance',
        title: '财务管理',
        icon: 'Money',
        children: [
            { path: '/finance/payment', title: '付款单管理', perm: 'finance:payment:list' }, // 记得去数据库补上这个权限码
            { path: '/finance/receipt', title: '收款单管理', perm: 'finance:receipt:list' }
        ]
    }
]

// 🛡️ 2. 核心过滤逻辑
const visibleMenuList = computed(() => {
    const perms = userStore.permissions || []
    const isAdmin = perms.includes('*') // 超级管理员看所有

    // 递归过滤函数
    const filterMenu = (menus: any[]) => {
        return menus.filter(menu => {
            // 2.1 先判断自己有没有权限
            let hasAuth = false
            if (isAdmin || !menu.perm) {
                hasAuth = true
            } else {
                hasAuth = perms.includes(menu.perm)
            }

            // 2.2 如果有子菜单，递归过滤子菜单
            if (hasAuth && menu.children && menu.children.length > 0) {
                menu.children = filterMenu(menu.children)
                // 关键点：如果过滤完子菜单，发现子菜单全都没了，那父菜单也不用显示了
                return menu.children.length > 0
            }

            return hasAuth
        })
    }

    // 深拷贝一份数据，防止直接修改原数组导致 bug
    const copyMenus = JSON.parse(JSON.stringify(allMenus))
    return filterMenu(copyMenus)
})

// 处理右上角命令
const handleCommand = (command: string) => {
    if (command === 'logout') {
        userStore.logout()
        ElMessage.success('退出成功')
        router.push('/login')
    }
}

const fetchTodoCount = async () => {
  const res: any = await getMyTasksApi()
  todoCount.value = res?.length || 0
}

onMounted(() => {
  fetchTodoCount()
  // 甚至可以搞个定时轮询，每5分钟查一次
  // setInterval(fetchTodoCount, 1000 * 60 * 5)
})
</script>

<style scoped>
.app-wrapper {
    height: 100vh;
    width: 100%;
}

.sidebar-container {
    background-color: #304156;
    height: 100%;
    overflow-x: hidden;
    /* 防止侧边栏滚动条丑陋 */
}

.logo {
    height: 50px;
    line-height: 50px;
    text-align: center;
    color: white;
    font-weight: bold;
    font-size: 20px;
    background-color: #2b2f3a;
}

.header-container {
    background-color: #fff;
    border-bottom: 1px solid #dcdfe6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
}

.header-left {
    display: flex;
    align-items: center;
}

.el-dropdown-link {
    cursor: pointer;
    display: flex;
    align-items: center;
}
</style>