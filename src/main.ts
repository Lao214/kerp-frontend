import { createApp } from 'vue'

import './style.css'
import App from './App.vue'

// 1. 引入 Element Plus 及其样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入中文包 (ERP系统必须支持中文)
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 2. 引入图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 3. 引入 Pinia (状态管理)
import { createPinia } from 'pinia'
// 4. 引入路由 (稍后我们马上建这个文件)
import router from './router'

import print from 'vue3-print-nb'

import { permission } from '../src/directive/permission'

const app = createApp(App)

// 注册图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(print)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn }) // 开启中文模式

app.directive('permission', permission) // 注册 v-permission
app.mount('#app')
