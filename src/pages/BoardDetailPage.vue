<template>
  <div v-if="loading" class="fullscreen flex flex-center">
    <q-spinner-gears color="primary" size="50px" />
  </div>

  <q-page v-else-if="board" class="board-detail-page">
    <!-- Переиспользуем компонент доски -->
    <board-component />
  </q-page>

  <div v-else class="fullscreen flex flex-center">
    <div class="text-center">
      <q-icon name="error" size="xl" color="negative" class="q-mb-md" />
      <div class="text-h5 text-negative">Доска не найдена</div>
      <q-btn
        color="primary"
        label="Вернуться к списку досок"
        @click="$router.push('/boards')"
        class="q-mt-md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import BoardComponent from 'src/components/board/BoardComponent.vue';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const boardStore = useBoardStore();

const loading = ref(true);
const board = ref(null);

onMounted(async () => {
  try {
    loading.value = true;
    board.value = await boardStore.fetchBoard(route.params.id);
  } catch (error: any) {
    console.error('Error loading board:', error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить доску',
    });
  } finally {
    loading.value = false;
  }
});

// Обновляем данные доски при изменении параметра маршрута
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      try {
        loading.value = true;
        board.value = await boardStore.fetchBoard(newId);
      } catch (error: any) {
        console.error('Error loading board:', error);
        router.push('/boards');
      } finally {
        loading.value = false;
      }
    }
  },
);
</script>

<style lang="scss" scoped>
.board-detail-page {
  padding: 0;
}
</style>
