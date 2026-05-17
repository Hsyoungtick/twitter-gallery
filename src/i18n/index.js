import { ref, computed, watch } from 'vue'
import zh from './zh.json'
import en from './en.json'

const messages = { zh, en }

const detectLanguage = () => {
  const stored = localStorage.getItem('lang')
  if (stored && messages[stored]) return stored
  const browserLang = navigator.language || navigator.userLanguage || 'zh'
  return browserLang.startsWith('zh') ? 'zh' : 'en'
}

const locale = ref(detectLanguage())

watch(locale, (val) => {
  localStorage.setItem('lang', val)
  document.documentElement.setAttribute('lang', val)
})

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

const replaceParams = (str, params) => {
  if (!params) return str
  return Object.entries(params).reduce(
    (result, [key, val]) => result.replace(`{${key}}`, val),
    str
  )
}

export const useI18n = () => {
  const t = (key, params) => {
    const msg = getNestedValue(messages[locale.value], key)
    if (!msg) return key
    return replaceParams(msg, params)
  }

  const toggleLocale = () => {
    locale.value = locale.value === 'zh' ? 'en' : 'zh'
  }

  const currentLocale = computed(() => locale.value)

  const localeLabel = computed(() => {
    return locale.value === 'zh' ? '中' : 'EN'
  })

  return { t, toggleLocale, currentLocale, localeLabel }
}
