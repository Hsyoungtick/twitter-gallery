import { createRouter, createWebHistory } from 'vue-router'
import Gallery from '../pages/Gallery.vue'
import Modal from '../components/Modal.vue'

const routes = [
  {
    path: '/',
    component: Gallery,
    name: 'gallery',
    children: [
      {
        path: 'p/:id',
        component: Modal,
        name: 'modal',
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 刷新页面时自动回到主页
let isNavigationFromRefresh = true

router.beforeEach((to, from, next) => {
  if (isNavigationFromRefresh && to.name === 'modal') {
    isNavigationFromRefresh = false
    next({ name: 'gallery' })
  } else if (!from.name && to.name === 'modal') {
    // 直接访问URL的情况也回到主页
    next({ name: 'gallery' })
  } else {
    next()
  }
})

// 监听浏览器刷新
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    isNavigationFromRefresh = true
  })
}

export default router
