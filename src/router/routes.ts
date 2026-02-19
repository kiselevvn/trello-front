const routes = [
  {
    path: '/',
    component: () => import('components/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/HomePage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'boards',
        name: 'boards',
        component: () => import('pages/BoardsPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'boards/:id',
        name: 'board-detail',
        component: () => import('pages/BoardDetailPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('pages/ProfilePage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('components/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('pages/LoginPage.vue'),
      },
      // {
      //   path: 'register',
      //   name: 'register',
      //   component: () => import('pages/RegisterPage.vue'),
      // },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
