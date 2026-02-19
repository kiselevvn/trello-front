<template>
  <q-dialog v-model="dialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">Создать новую доску</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="title"
            label="Название доски *"
            outlined
            :rules="[(val) => !!val || 'Введите название доски']"
          />

          <q-input v-model="description" label="Описание" type="textarea" rows="3" outlined />

          <div>
            <div class="text-caption q-mb-sm">Цвет фона</div>
            <div class="row q-gutter-sm">
              <div
                v-for="color in colors"
                :key="color"
                class="color-option cursor-pointer"
                :style="{ backgroundColor: color }"
                :class="{ selected: selectedColor === color }"
                @click="selectedColor = color"
              >
                <q-icon v-if="selectedColor === color" name="check" color="white" size="xs" />
              </div>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" v-close-popup />
        <q-btn
          color="primary"
          label="Создать"
          @click="onSubmit"
          :loading="loading"
          :disable="!title"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useBoardStore } from 'src/stores/board';

const $q = useQuasar();
const boardStore = useBoardStore();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'created']);

const dialog = ref(props.modelValue);
const title = ref('');
const description = ref('');
const selectedColor = ref('#0079bf');
const loading = ref(false);

const colors = [
  '#0079bf',
  '#519839',
  '#d29034',
  '#b04632',
  '#89609e',
  '#055a8c',
  '#4bbf6b',
  '#00aecc',
];

watch(
  () => props.modelValue,
  (val) => {
    dialog.value = val;
  },
);

watch(dialog, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    resetForm();
  }
});

const resetForm = () => {
  title.value = '';
  description.value = '';
  selectedColor.value = '#0079bf';
};

const onSubmit = async () => {
  try {
    loading.value = true;
    const board = await boardStore.createBoard({
      title: title.value,
      description: description.value,
      background_color: selectedColor.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Доска успешно создана',
    });

    emit('created', board);
    dialog.value = false;
  } catch (error: any) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Не удалось создать доску',
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.color-option {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  border: 2px solid transparent;

  &:hover {
    transform: scale(1.1);
  }

  &.selected {
    border-color: #1976d2;
    transform: scale(1.1);
  }
}
</style>
