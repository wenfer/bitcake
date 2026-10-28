<template>
  <article
    class="torrent-card"
    :class="{ 'is-selected': selected, 'is-paused': isPaused }"
    @contextmenu="onContextMenu"
  >
    <header class="torrent-card__head">
      <el-checkbox
        class="torrent-card__check"
        :model-value="selected"
        :aria-label="name"
        @change="emit('toggle', !selected)"
        @click.stop
      />
      <h3 class="torrent-card__name" :title="name" @click="emit('open')">
        {{ name }}
      </h3>
      <el-tag size="small" :type="tagType" effect="light" class="torrent-card__status">
        {{ statusText }}
      </el-tag>
    </header>

    <div class="torrent-card__progress">
      <el-progress
        :percentage="progressPercent"
        :stroke-width="8"
        :show-text="false"
        :status="progressStatus"
      />
      <span class="torrent-card__percent">{{ progressPercent }}%</span>
    </div>

    <dl class="torrent-card__meta">
      <div>
        <dt>{{ labels.size }}</dt>
        <dd>{{ sizeText }}</dd>
      </div>
      <div>
        <dt>{{ labels.speed }}</dt>
        <dd>{{ speedText }}</dd>
      </div>
      <div>
        <dt>{{ labels.eta }}</dt>
        <dd>{{ etaText }}</dd>
      </div>
      <div>
        <dt>{{ labels.ratio }}</dt>
        <dd>{{ ratioText }}</dd>
      </div>
    </dl>

    <p v-if="errorText" class="torrent-card__error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorText }}</span>
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElCheckbox, ElProgress, ElTag } from "element-plus";
import { WarningFilled } from "@element-plus/icons-vue";
import type { StatusTagType } from "@/types/torrent";

interface CardLabels {
  size: string;
  speed: string;
  eta: string;
  ratio: string;
}

const props = defineProps<{
  name: string;
  selected: boolean;
  statusText: string;
  statusType: StatusTagType;
  progressPercent: number;
  sizeText: string;
  speedText: string;
  etaText: string;
  ratioText: string;
  errorText?: string;
  isPaused?: boolean;
  labels: CardLabels;
}>();

const emit = defineEmits<{
  (e: "toggle", value: boolean): void;
  (e: "open"): void;
  (e: "menu", payload: { x: number; y: number }): void;
}>();

const tagType = computed<StatusTagType>(() => props.statusType);

const progressStatus = computed(() => {
  if (props.progressPercent >= 100) return "success";
  if (props.statusType === "danger") return "exception";
  return "";
});

const onContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  emit("menu", { x: event.clientX, y: event.clientY });
};
</script>

<style scoped>
.torrent-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--bc-radius-md);
  border: 1px solid var(--bc-border);
  background: var(--bc-surface);
  box-shadow: var(--bc-shadow-sm);
  transition: border-color var(--bc-duration) var(--bc-ease),
    box-shadow var(--bc-duration) var(--bc-ease),
    transform var(--bc-duration) var(--bc-ease);
}

.torrent-card:active {
  transform: scale(0.995);
}

.torrent-card.is-selected {
  border-color: var(--bc-accent);
  box-shadow: 0 0 0 3px var(--bc-accent-ring);
}

.torrent-card.is-paused {
  opacity: 0.86;
}

.torrent-card__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.torrent-card__check {
  margin-top: 2px;
  height: auto;
}

.torrent-card__name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--bc-text);
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.torrent-card__status {
  flex: 0 0 auto;
}

.torrent-card__progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.torrent-card__progress :deep(.el-progress) {
  flex: 1 1 auto;
}

.torrent-card__percent {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--bc-text-muted);
  min-width: 38px;
  text-align: right;
}

.torrent-card__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  margin: 0;
}

.torrent-card__meta > div {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.torrent-card__meta dt {
  font-size: 11px;
  color: var(--bc-text-subtle);
  flex: 0 0 auto;
}

.torrent-card__meta dd {
  margin: 0;
  font-size: 12px;
  font-weight: 550;
  color: var(--bc-text);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.torrent-card__error {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 10px;
  border-radius: var(--bc-radius-sm);
  background: color-mix(in srgb, var(--bc-danger) 12%, transparent);
  color: var(--bc-danger);
  font-size: 12px;
}

@media (min-width: 600px) {
  .torrent-card__meta {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
