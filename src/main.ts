import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

// Import i18n
import i18n, { getLocale } from './i18n'

// Register Service Worker
import { registerSW } from './utils/swRegister'
registerSW()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// 根据当前语言设置 Element Plus locale
const getElementLocale = () => {
  return getLocale() === 'zh-CN' ? zhCn : en
}

app.use(ElementPlus, { locale: getElementLocale() })

// 监听语言变化，动态更新 Element Plus locale
watch(
  () => i18n.global.locale.value,
  () => {
    // Element Plus 需要重新配置才能切换语言
    // 由于 Element Plus 不支持动态切换，我们在 useLocale store 中处理刷新
  }
)

app.mount('#app')
