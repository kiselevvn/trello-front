<template>
  <q-page class="boards-page q-pa-lg">
    <!-- Заголовок и фильтры -->
    <div class="row items-center q-mb-xl">
      <div class="col">
        <div class="text-h3 text-weight-bold">Все доски</div>
        <div class="text-h6 text-grey-7 q-mt-sm">Организуйте ваши проекты и задачи</div>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Новая доска"
          @click="showCreateBoardDialog = true"
          size="lg"
        />
      </div>
    </div>

    <!-- Фильтры -->
    <div class="row items-center q-mb-lg q-gutter-md">
      <div class="col-auto">
        <q-btn-toggle
          v-model="filter"
          toggle-color="primary"
          :options="[
            { label: 'Все', value: 'all' },
            { label: 'Мои', value: 'owned' },
            { label: 'Общие', value: 'shared' },
            { label: 'Архив', value: 'archived' },
          ]"
          rounded
        />
      </div>

      <q-space />

      <div class="col-auto">
        <q-input
          v-model="searchQuery"
          placeholder="Поиск досок..."
          dense
          outlined
          clearable
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- Список досок -->
    <div v-if="filteredBoards.length > 0" class="row q-col-gutter-lg">
      <div
        v-for="board in paginatedBoards"
        :key="board.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card
          class="board-card cursor-pointer"
          :style="{ backgroundColor: board.background_color }"
          @click="$router.push(`/boards/${board.id}`)"
        >
          <q-card-section class="text-white">
            <div class="row items-center justify-between">
              <div class="col">
                <div class="text-h6 text-weight-bold q-mb-xs">{{ board.title }}</div>
                <div class="text-caption opacity-80">
                  {{ board.is_owner ? 'Владелец: Вы' : `Владелец: ${board.owner.username}` }}
                </div>
              </div>
              <div class="col-auto">
                <q-badge v-if="board.is_archived" color="white" text-color="black"> Архив </q-badge>
              </div>
            </div>

            <div v-if="board.description" class="q-mt-md">
              {{ truncateText(board.description, 80) }}
            </div>

            <div class="row items-center justify-between q-mt-md">
              <div class="col">
                <div class="row items-center">
                  <q-icon name="dashboard" size="sm" class="q-mr-xs" />
                  <span class="text-caption">{{ board.columns?.length || 0 }} колонок</span>
                </div>
              </div>
              <div class="col-auto">
                <q-icon name="people" size="sm" v-if="board.members && board.members.length > 0" />
                <span class="text-caption q-ml-xs">
                  {{ board.members?.length || 0 }}
                </span>
              </div>
            </div>
          </q-card-section>

          <!-- Действия с доской -->
          <q-card-actions class="bg-white">
            <q-space />
            <q-btn flat round dense icon="more_vert" @click.stop="showBoardMenu(board)">
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 150px">
                  <q-item clickable @click.stop="editBoard(board)">
                    <q-item-section avatar>
                      <q-icon name="edit" />
                    </q-item-section>
                    <q-item-section>Редактировать</q-item-section>
                  </q-item>

                  <q-item clickable @click.stop="duplicateBoard(board)">
                    <q-item-section avatar>
                      <q-icon name="content_copy" />
                    </q-item-section>
                    <q-item-section>Дублировать</q-item-section>
                  </q-item>

                  <q-separator />

                  <q-item clickable @click.stop="toggleArchiveBoard(board)" class="text-negative">
                    <q-item-section avatar>
                      <q-icon name="archive" />
                    </q-item-section>
                    <q-item-section>
                      {{ board.is_archived ? 'Восстановить' : 'Архивировать' }}
                    </q-item-section>
                  </q-item>

                  <q-item
                    v-if="board.is_owner"
                    clickable
                    @click.stop="deleteBoard(board)"
                    class="text-negative"
                  >
                    <q-item-section avatar>
                      <q-icon name="delete" />
                    </q-item-section>
                    <q-item-section>Удалить</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Пустой состояние -->
    <div v-else class="empty-state text-center q-pa-xl">
      <q-icon name="dashboard" size="xl" color="grey-4" class="q-mb-md" />
      <div class="text-h5 text-grey-6 q-mb-sm">
        {{ getEmptyStateMessage() }}
      </div>
      <div class="text-grey-5 q-mb-lg">
        {{ getEmptyStateSubmessage() }}
      </div>
      <q-btn
        v-if="filter !== 'archived'"
        color="primary"
        icon="add"
        label="Создать доску"
        @click="showCreateBoardDialog = true"
      />
      <q-btn v-else flat label="Вернуться к активным доскам" @click="filter = 'all'" />
    </div>

    <!-- Пагинация -->
    <div v-if="filteredBoards.length > itemsPerPage" class="row justify-center q-mt-xl">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="6"
        direction-links
        boundary-links
        color="primary"
      />
    </div>

    <!-- Диалоги -->
    <create-board-dialog v-model="showCreateBoardDialog" />
    <board-edit-dialog
      v-model="showEditBoardDialog"
      :board="selectedBoard"
      @board-updated="onBoardUpdated"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';
import CreateBoardDialog from 'src/components/board/CreateBoardDialog.vue';
import BoardEditDialog from 'src/components/board/BoardEditDialog.vue';

const $q = useQuasar();
const boardStore = useBoardStore();

const filter = ref('all');
const searchQuery = ref('');
const showCreateBoardDialog = ref(false);
const showEditBoardDialog = ref(false);
const selectedBoard = ref(null);
const currentPage = ref(1);
const itemsPerPage = 12;

// Фильтрация досок
const filteredBoards = computed(() => {
  let boards = [...boardStore.boards];

  // Применяем фильтр
  switch (filter.value) {
    case 'owned':
      boards = boardStore.ownedBoards;
      break;
    case 'shared':
      boards = boardStore.memberBoards;
      break;
    case 'archived':
      boards = boardStore.archivedBoards;
      break;
    case 'all':
    default:
      boards = boardStore.activeBoards;
      break;
  }

  // Применяем поиск
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    boards = boards.filter(
      (board) =>
        board.title.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query) ||
        board.owner.username.toLowerCase().includes(query),
    );
  }

  // Сортируем по дате обновления
  return boards.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
});

// Пагинация
const totalPages = computed(() => Math.ceil(filteredBoards.value.length / itemsPerPage));
const paginatedBoards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredBoards.value.slice(start, end);
});

onMounted(async () => {
  try {
    await boardStore.fetchBoards();
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось загрузить доски',
    });
  }
});

// Вспомогательные методы
const truncateText = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const getEmptyStateMessage = () => {
  switch (filter.value) {
    case 'owned':
      return 'У вас нет собственных досок';
    case 'shared':
      return 'У вас нет общих досок';
    case 'archived':
      return 'Архив пуст';
    default:
      return 'Доски не найдены';
  }
};

const getEmptyStateSubmessage = () => {
  switch (filter.value) {
    case 'owned':
      return 'Создайте свою первую доску для управления задачами';
    case 'shared':
      return 'Вас еще не добавили в общие доски';
    case 'archived':
      return 'Нет архивированных досок';
    default:
      return searchQuery.value
        ? 'Попробуйте изменить поисковый запрос'
        : 'Создайте доску или попросите добавить вас в существующую';
  }
};

// Действия с досками
const showBoardMenu = (board) => {
  selectedBoard.value = board;
};

const editBoard = (board) => {
  selectedBoard.value = board;
  showEditBoardDialog.value = true;
};

const duplicateBoard = async (board) => {
  $q.dialog({
    title: 'Дублирование доски',
    message: `Вы уверены, что хотите создать копию доски "${board.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const newBoard = await boardStore.createBoard({
        title: `${board.title} (Копия)`,
        description: board.description,
        background_color: board.background_color,
      });

      // Копируем колонки
      for (const column of board.columns || []) {
        await boardStore.createColumn({
          title: column.title,
          board: newBoard.id,
          color: column.color,
        });
      }

      $q.notify({
        type: 'positive',
        message: 'Доска успешно скопирована',
      });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось скопировать доску',
      });
    }
  });
};

const toggleArchiveBoard = async (board) => {
  const action = board.is_archived ? 'восстановить' : 'архивировать';

  $q.dialog({
    title: `${action.charAt(0).toUpperCase() + action.slice(1)} доску`,
    message: `Вы уверены, что хотите ${action} доску "${board.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await boardStore.updateBoard(board.id, {
        is_archived: !board.is_archived,
      });

      $q.notify({
        type: 'positive',
        message: `Доска успешно ${action}на`,
      });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: `Не удалось ${action} доску`,
      });
    }
  });
};

const deleteBoard = async (board) => {
  $q.dialog({
    title: 'Удаление доски',
    message: `Вы уверены, что хотите удалить доску "${board.title}"? Это действие нельзя отменить.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await boardStore.deleteBoard(board.id);
      $q.notify({
        type: 'positive',
        message: 'Доска успешно удалена',
      });
    } catch (error: any) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить доску',
      });
    }
  });
};

const onBoardUpdated = (updatedBoard) => {
  const index = boardStore.boards.findIndex((b) => b.id === updatedBoard.id);
  if (index !== -1) {
    boardStore.boards[index] = { ...boardStore.boards[index], ...updatedBoard };
  }
};

// Следим за изменениями фильтра и сбрасываем страницу
watch(filter, () => {
  currentPage.value = 1;
});

watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>

<style lang="scss" scoped>
.boards-page {
  background: #f5f7fa;
  min-height: 100vh;
}

.search-input {
  width: 300px;

  @media (max-width: 600px) {
    width: 200px;
  }
}

.board-card {
  height: 200px;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
  }

  .q-card__section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .opacity-80 {
    opacity: 0.8;
  }
}

.empty-state {
  background: white;
  border-radius: 12px;
  margin-top: 50px;
}
</style>
