<template>
  <div class="vscode-sidebar">
    <!-- Секции с раскрывающимися группами -->
    <div v-for="section in sections" :key="section.id" class="sidebar-section">
      <!-- Заголовок секции -->
      <div class="section-header" @click="toggleSection(section.id)">
        <div class="header-content">
          <q-icon :name="section.icon" size="16px" class="section-icon" />
          <span class="section-title">{{ section.title }}</span>
        </div>
        <q-icon
          :name="section.isExpanded ? 'expand_less' : 'expand_more'"
          size="16px"
          class="toggle-icon"
        />
      </div>

      <!-- Содержимое секции -->
      <q-slide-transition>
        <div v-show="section.isExpanded" class="section-content">
          <div class="section-items">
            <div
              v-for="item in section.items"
              :key="item.id"
              class="section-item"
              :class="{ active: activeItem === item.id }"
              @click="selectItem(item.id)"
            >
              <q-icon v-if="item.icon" :name="item.icon" size="14px" class="item-icon" />
              <span class="item-label">{{ item.label }}</span>
              <q-badge v-if="item.badge" :label="item.badge" class="item-badge" />
            </div>
          </div>
        </div>
      </q-slide-transition>
    </div>

    <!-- Разделитель для изменения размера -->
    <div class="resize-handle" @mousedown="startResize" @touchstart="startResize" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  badge?: string | number;
}

interface SidebarSection {
  id: string;
  title: string;
  icon: string;
  isExpanded: boolean;
  items: SidebarItem[];
}

// Состояние секций
const sections = ref<SidebarSection[]>([
  {
    id: 'explorer',
    title: 'Explorer',
    icon: 'folder',
    isExpanded: true,
    items: [
      { id: 'open-editors', label: 'OPEN EDITORS', icon: 'menu_book' },
      { id: 'folder-1', label: 'project-name', icon: 'folder_open' },
      { id: 'folder-2', label: 'src', icon: 'folder' },
      { id: 'folder-3', label: 'components', icon: 'folder' },
      { id: 'file-1', label: 'App.vue', icon: 'description' },
    ],
  },
  {
    id: 'search',
    title: 'Search',
    icon: 'search',
    isExpanded: true,
    items: [
      { id: 'search-1', label: 'SEARCH', icon: 'search' },
      { id: 'search-2', label: 'Replace', icon: 'find_replace' },
    ],
  },
  {
    id: 'git',
    title: 'Source Control',
    icon: 'code',
    isExpanded: false,
    items: [
      { id: 'git-1', label: 'SOURCE CONTROL', icon: 'fork_right' },
      { id: 'git-2', label: 'Changes', icon: 'change_history', badge: '3' },
    ],
  },
  {
    id: 'extensions',
    title: 'Extensions',
    icon: 'extension',
    isExpanded: false,
    items: [
      { id: 'ext-1', label: 'EXTENSIONS', icon: 'extension' },
      { id: 'ext-2', label: 'Installed', icon: 'check_circle' },
    ],
  },
]);

// Активный элемент
const activeItem = ref<string>('file-1');

// Переключение секции
const toggleSection = (sectionId: string) => {
  const section = sections.value.find((s) => s.id === sectionId);
  if (section) {
    section.isExpanded = !section.isExpanded;
  }
};

// Выбор элемента
const selectItem = (itemId: string) => {
  activeItem.value = itemId;
};

// Логика изменения размера
const isResizing = ref(false);
const sidebarWidth = ref(250); // начальная ширина
const minWidth = 200;
const maxWidth = 500;

const startResize = (e: MouseEvent | TouchEvent) => {
  isResizing.value = true;
  e.preventDefault();

  const isTouchEvent = 'touches' in e;
  const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
  const startX = clientX;
  const startWidth = sidebarWidth.value;

  const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
    if (!isResizing.value) return;

    const moveIsTouchEvent = 'touches' in moveEvent;
    const currentX = moveIsTouchEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const deltaX = currentX - startX;

    let newWidth = startWidth + deltaX;
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    sidebarWidth.value = newWidth;

    // Обновляем CSS переменную
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
  };

  const handleMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleMouseMove as EventListener);
    document.removeEventListener('touchmove', handleMouseMove as EventListener);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchend', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove as EventListener);
  document.addEventListener('touchmove', handleMouseMove as EventListener, { passive: false });
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchend', handleMouseUp);
};

// Инициализация ширины
onMounted(() => {
  document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth.value}px`);
});

// Очистка событий
onUnmounted(() => {
  document.removeEventListener('mousemove', () => {});
  document.removeEventListener('mouseup', () => {});
});
</script>

<style scoped>
.vscode-sidebar {
  width: var(--sidebar-width, 250px);
  height: 100%;
  background-color: var(--q-dark);
  color: var(--q-dark-page);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  user-select: none;
  transition: width 0.1s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.sidebar-section {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.7);
  transition: background-color 0.2s ease;
  height: 32px;
  box-sizing: border-box;
}

.section-header:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.section-icon {
  opacity: 0.7;
  flex-shrink: 0;
}

.section-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toggle-icon {
  opacity: 0.5;
  flex-shrink: 0;
}

.section-content {
  background-color: rgba(0, 0, 0, 0.1);
}

.section-items {
  padding: 4px 0;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 4px 12px 4px 28px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  height: 24px;
  position: relative;
  transition: background-color 0.2s ease;
  gap: 6px;
}

.section-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.section-item.active {
  background-color: rgba(30, 144, 255, 0.2);
  color: #1e90ff;
}

.section-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #1e90ff;
}

.item-icon {
  opacity: 0.7;
  flex-shrink: 0;
}

.section-item.active .item-icon {
  opacity: 1;
  color: #1e90ff;
}

.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.item-badge {
  font-size: 10px;
  padding: 2px 4px;
  min-width: 16px;
  height: 16px;
  background-color: rgba(30, 144, 255, 0.3);
  color: #1e90ff;
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.resize-handle:hover,
.is-resizing .resize-handle {
  background-color: rgba(30, 144, 255, 0.5);
}

/* Стили для Quasar */
:deep(.q-icon) {
  font-size: inherit;
}

/* Скрытие скроллбара для Webkit браузеров */
.vscode-sidebar::-webkit-scrollbar {
  width: 4px;
}

.vscode-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.vscode-sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.vscode-sidebar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
