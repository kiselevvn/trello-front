<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <router-link to="/" class="text-white text-decoration-none"> Trello App </router-link>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import { useUserStore } from 'src/stores/user';

const $q = useQuasar();
const router = useRouter();
const boardStore = useBoardStore();
const userStore = useUserStore();
</script>

<style lang="scss" scoped>
.color-preview {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    border-color: #1976d2;
  }
}

.text-decoration-none {
  text-decoration: none;
}
</style>
