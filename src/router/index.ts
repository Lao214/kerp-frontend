import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user' // 引入 Store

// 1. 定义路由
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue')
  },
  {
    path: '/finance',
    component: () => import('../layout/index.vue'),
    meta: { title: '财务管理', icon: 'Money' },
    children: [
      {
        path: 'receipt',
        name: 'FinReceipt',
        component: () => import('../views/finance/receipt/index.vue'),
        meta: { title: '收款单(AR)' }
      },
      {
        path: 'payment',
        name: 'FinPayment',
        component: () => import('../views/finance/payment/index.vue'),
        meta: { title: '付款单(AP)' }
      }
    ]
  },
  {
    path: '/system',
    component: () => import('../layout/index.vue'),
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'UserConfig',
        component: () => import('../views/system/user/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'role',
        name: 'RoleConfig',
        component: () => import('../views/system/role/index.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'dept',
        name: 'DeptConfig',
        component: () => import('../views/system/dept/index.vue'),
        meta: { title: '部门管理' }
      },
      {
        path: 'todo',
        name: 'WorkflowTodo',
        component: () => import('../views/system/flow/todo.vue'),
        meta: { title: '我的待办', icon: 'Clock', perm: 'workflow:todo:list' }
      }
    ]
  },
  {
    path: '/basic',
    component: () => import('../layout/index.vue'),
    meta: { title: '基础资料', icon: 'Files' },
    children: [
      {
        path: 'product',
        name: 'ProductConfig',
        component: () => import('../views/basic/product/index.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'supplier',
        name: 'SupplierConfig',
        component: () => import('../views/basic/supplier/index.vue'),
        meta: { title: '供应商管理' }
      },
      {
        path: 'customer',
        name: 'CustomerConfig',
        component: () => import('../views/basic/customer/index.vue'),
        meta: { title: '客户管理' }
      },
      {
        path: 'warehouse',
        name: 'WarehouseConfig',
        component: () => import('../views/basic/warehouse/index.vue'),
        meta: { title: '仓库管理' }
      }
    ]
  },
  {
    path: '/psi',
    component: () => import('../layout/index.vue'),
    meta: { title: '进销存管理', icon: 'Management' },
    children: [
      {
        path: 'purchase',
        name: 'Purchase',
        component: () => import('../views/psi/purchase/index.vue'),
        meta: { title: '采购单管理' }
      },
      {
        path: 'sales',
        name: 'Sales',
        component: () => import('../views/psi/sales/index.vue'),
        meta: { title: '销售单管理' }
      },
      {
        path: 'inventory',
        name: 'InventoryReport',
        component: () => import('../views/psi/inventory/index.vue'),
        meta: { title: '库存查询' }
      }
    ]
  },
  {
    path: '/',
    component: () => import('../layout/index.vue'), // 使用刚才写的 Layout
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        // 👇 指向我们新写的页面
        component: () => import('../views/dashborad/index.vue'),
        meta: { title: '首页', icon: 'Odometer' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 2. 全局路由守卫 (保安)
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (userStore.token) {
    // 已登录
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      // 🚀 核心修复：如果是刷新页面，store 里的 permissions 是空的
      // 我们要在这里强制拉取一次用户信息
      if (!userStore.isUserInfoLoaded) {
        try {
          await userStore.getUserInfo() // 等待接口返回
          next({ ...to, replace: true }) // 重新进一次当前路由，触发指令重新渲染
        } catch (error) {
          // 如果拉取失败（比如 token 过期），强制登出
          userStore.logout()
          next('/login')
        }
      } else {
        next() // 权限已经有了，直接放行
      }
    }
  } else {
    // 未登录
    if (to.path === '/login') {
      next()
    } else {
      next('/login')
    }
  }
})

export default router