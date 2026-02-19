<template>
  <q-page class="flex flex-center auth-page">
    <q-card class="auth-card" style="min-width: 400px; max-width: 600px">
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold q-mb-xs">Добро пожаловать!</div>
        <div class="text-grey-6 q-mb-lg">Войдите в свой аккаунт</div>

        <q-form @submit="onSubmit">
          <q-input
            v-model="form.username"
            label="Имя пользователя"
            outlined
            :rules="[(val) => !!val || 'Введите имя пользователя']"
          />

          <q-input
            v-model="form.password"
            label="Пароль"
            type="password"
            outlined
            :rules="[(val) => !!val || 'Введите пароль']"
          />

          <div class="row items-center justify-between">
            <q-checkbox v-model="rememberMe" label="Запомнить меня" />
            <q-btn flat label="Забыли пароль?" color="primary" size="sm" />
          </div>

          <q-btn
            type="submit"
            color="primary"
            label="Войти"
            class="full-width q-mt-lg"
            size="lg"
            :loading="loading"
          />

          <div class="text-center">
            <span class="text-grey-7">Нет аккаунта? </span>
            <span @click="registerForm.show = true" class="text-primary cursor-pointer">
              Зарегистрироваться
            </span>
          </div>
        </q-form>
      </q-card-section>
      <q-dialog v-model="registerForm.show" persistent>
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6 text-center">Регистрация</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input class="q-mt-md" v-model="registerForm.username" autofocus label="Логин" />
            <q-input
              class="q-mt-md"
              v-model="registerForm.password"
              autofocus
              label="Пароль"
              type="password"
            />
            <q-input
              class="q-mt-md"
              v-model="registerForm.passwordRepeat"
              label="Повторите пароль"
              autofocus
              type="password"
            />
          </q-card-section>

          <q-card-actions align="right" class="row justify-around text-primary">
            <q-btn flat class="bg-red text-white" label="Отмена" v-close-popup />
            <q-btn
              @click="onRegister"
              flat
              class="bg-green text-white"
              label="Создать"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/user';

const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();

const form = ref({
  username: '',
  password: '',
});

const registerForm = ref({
  username: '',
  password: '',
  passwordRepeat: '',
  show: false,
});

const rememberMe = ref(false);
const loading = ref(false);

const onSubmit = async () => {
  try {
    loading.value = true;
    await userStore.login(form.value);

    $q.notify({
      type: 'positive',
      message: 'Вход выполнен успешно',
    });

    router.push('/');
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || 'Ошибка входа',
    });
  } finally {
    loading.value = false;
  }
};

const onRegister = async () => {
  try {
    if (registerForm.value.password !== registerForm.value.passwordRepeat)
      $q.notify({
        type: 'negative',
        message: 'Пароли не совпадают',
      });
    await userStore.register({
      username: registerForm.value.username,
      password: registerForm.value.password,
      password2: registerForm.value.passwordRepeat,
    } as any);

    $q.notify({
      type: 'positive',
      message: 'Учетная запись создана',
    });

    router.push('/');
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.detail || 'Ошибка при регистрации',
    });
  }
};
</script>

<style lang="scss" scoped>
.auth-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
</style>
