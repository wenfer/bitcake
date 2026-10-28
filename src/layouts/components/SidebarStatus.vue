<template>
  <div class="sidebar-status">
    <div class="status-header">系统状态</div>
    <div class="status-list">
      <div v-for="metric in metrics" :key="metric.label" class="status-item">
        <span class="status-label">{{ metric.label }}</span>
        <span class="status-value">{{ metric.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Metric {
  label: string
  value: string
}

defineProps<{
  metrics: Metric[]
}>()
</script>

<style scoped>
.sidebar-status {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid var(--bc-border);
  background: var(--bc-surface);
}

.status-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--bc-text-subtle);
  margin-bottom: 8px;
  padding-left: 4px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 7px 10px;
  background: var(--bc-surface-muted);
  border: 1px solid var(--bc-border);
  border-radius: var(--bc-radius-sm);
}

.status-label {
  color: var(--bc-text-subtle);
  flex: 0 0 auto;
}

.status-value {
  color: var(--bc-text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .sidebar-status {
    padding: 12px 16px 0px;
  }
}
</style>
