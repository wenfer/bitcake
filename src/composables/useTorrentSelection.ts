import { computed, ref, type Ref } from "vue";
import type { Torrent } from "@/types/transmission";

/**
 * Owns torrent selection independently from the table implementation.
 * IDs are the source of truth so refreshed torrent objects do not invalidate selection.
 */
export const useTorrentSelection = (
  torrents: Ref<Torrent[]>,
  visiblePage: Ref<Torrent[]>
) => {
  const selectedIdsState = ref<number[]>([]);
  const lastClickedTorrentId = ref<number | null>(null);

  const selectedIdSet = computed(() => new Set(selectedIdsState.value));
  const selectedTorrents = computed(() => {
    const ids = selectedIdSet.value;
    return torrents.value.filter((torrent) => ids.has(torrent.id));
  });
  const hasSelection = computed(() => selectedIdsState.value.length > 0);
  const isAllSelected = computed(() => {
    const page = visiblePage.value;
    const ids = selectedIdSet.value;
    return page.length > 0 && page.every((torrent) => ids.has(torrent.id));
  });
  const isIndeterminate = computed(() => {
    const page = visiblePage.value;
    const ids = selectedIdSet.value;
    let selectedCount = 0;
    for (const torrent of page) {
      if (ids.has(torrent.id)) selectedCount += 1;
    }
    return selectedCount > 0 && selectedCount < page.length;
  });

  const isSelected = (id: number) => selectedIdSet.value.has(id);

  const toggleRow = (torrent: Torrent, selected: boolean) => {
    const ids = new Set(selectedIdsState.value);
    if (selected) ids.add(torrent.id);
    else ids.delete(torrent.id);
    selectedIdsState.value = [...ids];
    lastClickedTorrentId.value = torrent.id;
  };

  const togglePage = (selected: boolean) => {
    const ids = new Set(selectedIdsState.value);
    for (const torrent of visiblePage.value) {
      if (selected) ids.add(torrent.id);
      else ids.delete(torrent.id);
    }
    selectedIdsState.value = [...ids];
  };

  const selectPage = () => {
    selectedIdsState.value = visiblePage.value.map((torrent) => torrent.id);
    lastClickedTorrentId.value =
      visiblePage.value[visiblePage.value.length - 1]?.id ?? null;
  };

  const handleRowClick = (row: Torrent, event: MouseEvent) => {
    const page = visiblePage.value;
    const clickedIndex = page.findIndex((torrent) => torrent.id === row.id);
    if (clickedIndex < 0) return;

    if (event.shiftKey) {
      const anchorIndex = page.findIndex(
        (torrent) => torrent.id === lastClickedTorrentId.value
      );
      if (anchorIndex >= 0) {
        const start = Math.min(anchorIndex, clickedIndex);
        const end = Math.max(anchorIndex, clickedIndex);
        selectedIdsState.value = page
          .slice(start, end + 1)
          .map((torrent) => torrent.id);
      } else {
        selectedIdsState.value = [row.id];
        lastClickedTorrentId.value = row.id;
      }
      return;
    }

    toggleRow(row, !isSelected(row.id));
  };

  const remove = (removedIds: Iterable<number>) => {
    const removed = new Set(removedIds);
    selectedIdsState.value = selectedIdsState.value.filter(
      (id) => !removed.has(id)
    );
    if (
      lastClickedTorrentId.value !== null &&
      removed.has(lastClickedTorrentId.value)
    ) {
      lastClickedTorrentId.value = null;
    }
  };

  const reconcile = () => {
    const availableIds = new Set(torrents.value.map((torrent) => torrent.id));
    const nextIds = selectedIdsState.value.filter((id) =>
      availableIds.has(id)
    );
    if (nextIds.length !== selectedIdsState.value.length) {
      selectedIdsState.value = nextIds;
    }
    if (
      lastClickedTorrentId.value !== null &&
      !availableIds.has(lastClickedTorrentId.value)
    ) {
      lastClickedTorrentId.value = null;
    }
  };

  const clear = () => {
    selectedIdsState.value = [];
    lastClickedTorrentId.value = null;
  };

  return {
    selectedIdsState,
    selectedTorrents,
    hasSelection,
    isAllSelected,
    isIndeterminate,
    isSelected,
    toggleRow,
    togglePage,
    selectPage,
    handleRowClick,
    remove,
    reconcile,
    clear,
  };
};
