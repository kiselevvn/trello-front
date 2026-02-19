<template>
  <q-dialog v-model="dialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">Метки доски</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Создание новой метки -->
        <div class="q-mb-lg">
          <div class="text-subtitle1 q-mb-sm">Создать новую метку</div>

          <div class="row q-gutter-md items-center">
            <q-input
              v-model="newLabel.name"
              placeholder="Название метки"
              outlined
              dense
              class="col"
            />

            <div class="col-auto">
              <q-color
                v-model="newLabel.color"
                default-view="palette"
                :palette="colorPalette"
                class="q-mr-sm"
              />
            </div>

            <div class="col-auto">
              <q-btn
                color="primary"
                label="Создать"
                @click="createLabel"
                :disable="!newLabel.name"
              />
            </div>
          </div>
        </div>

        <!-- Список меток -->
        <div>
          <div class="text-subtitle1 q-mb-sm">Существующие метки</div>

          <div v-if="labels.length === 0" class="text-center q-py-lg">
            <q-icon name="label_off" size="xl" color="grey-4" class="q-mb-sm" />
            <div class="text-grey-6">Меток пока нет</div>
          </div>

          <q-list separator v-else>
            <q-item v-for="label in labels" :key="label.id" class="q-py-md">
              <q-item-section avatar>
                <div class="label-preview" :style="{ backgroundColor: label.color }" />
              </q-item-section>

              <q-item-section>
                <q-input v-model="label.name" dense borderless @blur="updateLabel(label)" />
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round icon="edit" size="sm" @click="editLabelColor(label)" />
                  <q-btn
                    flat
                    round
                    icon="delete"
                    size="sm"
                    color="negative"
                    @click="deleteLabel(label)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Закрыть" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';

const $q = useQuasar();
const boardStore = useBoardStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  boardId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const dialog = ref(props.modelValue);
const labels = ref([]);
const newLabel = ref({
  name: '',
  color: '#61bd4f',
});

const colorPalette = [
  '#61bd4f', // зеленый
  '#f2d600', // желтый
  '#ff9f1a', // оранжевый
  '#eb5a46', // красный
  '#c377e0', // фиолетовый
  '#0079bf', // синий
  '#00c2e0', // голубой
  '#51e898', // светло-зеленый
  '#ff78cb', // розовый
  '#344563', // темно-синий
];

watch(
  () => props.modelValue,
  (val) => {
    dialog.value = val;
    if (val) {
      loadLabels();
    }
  },
);

watch(dialog, (val) => {
  emit('update:modelValue', val);
});

onMounted(async () => {
  await loadLabels();
});

const loadLabels = async () => {
  try {
    labels.value = await boardStore.fetchLabels(props.boardId);
  } catch (error) {
    console.error('Error loading labels:', error);
  }
};

const createLabel = async () => {
  try {
    const label = await boardStore.createLabel(props.boardId, newLabel.value);
    labels.value.push(label);

    // Сбрасываем форму
    newLabel.value = {
      name: '',
      color: '#61bd4f',
    };

    $q.notify({
      type: 'positive',
      message: 'Метка создана',
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось создать метку',
    });
  }
};

const updateLabel = async (label) => {
  try {
    await boardStore.updateLabel(label.id, {
      name: label.name,
      color: label.color,
    });

    $q.notify({
      type: 'positive',
      message: 'Метка обновлена',
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось обновить метку',
    });
  }
};

const editLabelColor = (label) => {
  $q.dialog({
    component: {
      template: `
        <q-card>
          <q-card-section>
            <div class="text-h6">Изменить цвет метки</div>
          </q-card-section>

          <q-card-section>
            <q-color
              v-model="color"
              default-view="palette"
              :palette="palette"
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Отмена" v-close-popup />
            <q-btn color="primary" label="Сохранить" @click="save" v-close-popup />
          </q-card-actions>
        </q-card>
      `,
      data() {
        return {
          color: label.color,
          palette: colorPalette,
        };
      },
      methods: {
        save() {
          this.$emit('ok', this.color);
        },
      },
    },
  }).onOk(async (color) => {
    try {
      await boardStore.updateLabel(label.id, { color });
      label.color = color;

      $q.notify({
        type: 'positive',
        message: 'Цвет метки изменен',
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось изменить цвет метки',
      });
    }
  });
};

const deleteLabel = (label) => {
  $q.dialog({
    title: 'Удалить метку',
    message: `Вы уверены, что хотите удалить метку "${label.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await boardStore.deleteLabel(label.id);
      labels.value = labels.value.filter((l) => l.id !== label.id);

      $q.notify({
        type: 'positive',
        message: 'Метка удалена',
      });
    } catch (error) {
      console.error(error);
      $q.notify({
        type: 'negative',
        message: 'Не удалось удалить метку',
      });
    }
  });
};
</script>

<style lang="scss" scoped>
.label-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
