import { route } from 'quasar/wrappers';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { useUserStore } from 'src/stores/user';

export default route(function (/* { store, ssrContext } */) {
  const router = createRouter({
    history: createWebHistory(process.env.VUE_ROUTER_BASE),
    routes: routes as any,
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition;
      } else {
        return { top: 0 };
      }
    },
  });

  // Глобальные хуки навигации
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore();

    // Проверяем, требует ли маршрут аутентификации
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!userStore.isAuthenticated) {
        // Перенаправляем на страницу входа
        next({
          path: '/auth/login',
          query: { redirect: to.fullPath },
        });
      } else {
        next();
      }
    } else if (to.path.startsWith('/auth')) {
      // Если пользователь уже аутентифицирован, перенаправляем с auth страниц
      if (userStore.isAuthenticated) {
        next({ path: '/' });
      } else {
        next();
      }
    } else {
      next();
    }
  });

  return router;
});
