import type { Directive } from 'vue'
import { useUserStore } from '../stores/user'

export const permission: Directive = {
    mounted(el, binding) {
        const { value } = binding
        const userStore = useUserStore()

        // 🛡️ 防御代码：如果 permissions 还没加载回来，给个空数组，防止报错
        const perms = userStore.permissions || []

        if (value && value instanceof Array && value.length > 0) {
            const permissionRoles = value

            // 现在的 perms 哪怕是空数组，调用 includes 也只会返回 false，不会报错
            const hasPermission = perms.includes('*') || perms.some(role => permissionRoles.includes(role))

            if (!hasPermission) {
                el.parentNode && el.parentNode.removeChild(el)
            }
        } else {
            throw new Error(`need roles! Like v-permission="['system:user:add']"`)
        }
    }
}