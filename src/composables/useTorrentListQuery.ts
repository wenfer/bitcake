import { computed, onScopeDispose, ref, watch, type Ref } from "vue";
import type { StatusFilter } from "@/stores/filter";
import { TorrentStatusEnum, type Torrent } from "@/types/transmission";
import { matchesTrackerFilter } from "@/utils/torrent";

export type TorrentSortOrder = "ascending" | "descending" | null;

interface TorrentListQueryOptions {
  torrents: Ref<Torrent[]>;
  statusFilter: Ref<StatusFilter>;
  trackerFilter: Ref<string>;
  categoryFilter: Ref<string>;
  downloadDirFilter: Ref<string>;
  errorTypeFilter: Ref<string>;
  labelFilter: Ref<string>;
  getNoCategoryLabel: () => string;
  getErrorType: (error?: string) => string;
  getDefaultTracker: (torrent: Torrent) => string;
}

const isTorrentError = (torrent: Torrent) =>
  (torrent.error ?? 0) > 0 || Boolean(torrent.errorString);

const getActiveLimit = (torrent: Torrent) => {
  const download = torrent.downloadLimited
    ? Math.max(0, Math.round(Number(torrent.downloadLimit) || 0))
    : 0;
  const upload = torrent.uploadLimited
    ? Math.max(0, Math.round(Number(torrent.uploadLimit) || 0))
    : 0;
  return Math.max(download, upload);
};

const getTrackerPeerCount = (
  torrent: Torrent,
  key: "seederCount" | "leecherCount"
) => {
  let count = 0;
  for (const stat of torrent.trackerStats ?? []) {
    const value = stat[key];
    if (typeof value === "number") count = Math.max(count, value);
  }
  return count;
};

/** Query model for filtering, sorting and paging the torrent collection. */
export const useTorrentListQuery = (options: TorrentListQueryOptions) => {
  const searchKeyword = ref("");
  const debouncedSearchKeyword = ref("");
  const sortState = ref<{ prop: string; order: TorrentSortOrder }>({
    prop: "addedDate",
    order: "descending",
  });
  const currentPage = ref(1);
  const pageSize = ref(50);
  const pageSizeOptions = [25, 50, 100, 200, 500] as const;

  const nameIndex = new Map<number, string>();
  const trackerIndex = new Map<number, string>();
  const indexRevision = ref(0);

  const updateIndexes = (items: Iterable<Torrent>) => {
    let changed = false;
    for (const torrent of items) {
      nameIndex.set(torrent.id, (torrent.name || "").toLowerCase());
      trackerIndex.set(torrent.id, options.getDefaultTracker(torrent));
      changed = true;
    }
    if (changed) indexRevision.value += 1;
  };

  const rebuildIndexes = (items: Torrent[]) => {
    nameIndex.clear();
    trackerIndex.clear();
    updateIndexes(items);
  };

  const removeIndexes = (ids: Iterable<number>) => {
    let changed = false;
    for (const id of ids) {
      changed = nameIndex.delete(id) || changed;
      changed = trackerIndex.delete(id) || changed;
    }
    if (changed) indexRevision.value += 1;
  };

  const filteredTorrents = computed(() => {
    // Map mutations are intentionally non-reactive; this revision invalidates
    // cached query results after an incremental torrent update.
    void indexRevision.value;
    const keyword = debouncedSearchKeyword.value.trim().toLowerCase();
    const noCategoryLabel = options.getNoCategoryLabel();
    const status = options.statusFilter.value;

    return options.torrents.value.filter((torrent) => {
      if (
        keyword &&
        !(nameIndex.get(torrent.id) ?? torrent.name.toLowerCase()).includes(keyword)
      ) {
        return false;
      }

      const matchesStatus =
        status === "all" ||
        (status === "error" && isTorrentError(torrent)) ||
        (status === "queued" &&
          (torrent.status === TorrentStatusEnum.CHECK_WAIT ||
            torrent.status === TorrentStatusEnum.DOWNLOAD_WAIT ||
            torrent.status === TorrentStatusEnum.SEED_WAIT)) ||
        (status === "active" &&
          (torrent.rateDownload > 0 || torrent.rateUpload > 0)) ||
        (typeof status === "number" && status === torrent.status);
      if (!matchesStatus) return false;

      if (
        options.trackerFilter.value &&
        !(torrent.trackers ?? []).some((tracker) =>
          matchesTrackerFilter(tracker.announce, options.trackerFilter.value)
        )
      ) {
        return false;
      }
      if (
        options.categoryFilter.value &&
        (options.categoryFilter.value === noCategoryLabel
          ? Boolean(torrent.category)
          : torrent.category !== options.categoryFilter.value)
      ) {
        return false;
      }
      if (
        options.downloadDirFilter.value &&
        torrent.downloadDir !== options.downloadDirFilter.value
      ) {
        return false;
      }
      if (
        options.errorTypeFilter.value &&
        (!isTorrentError(torrent) ||
          options.getErrorType(torrent.errorString) !==
            options.errorTypeFilter.value)
      ) {
        return false;
      }
      if (options.labelFilter.value) {
        const labels = torrent.labels ?? [];
        const matchesLabel =
          options.labelFilter.value === "__no_label__"
            ? !labels.some((label) => !label.startsWith("category:"))
            : labels.includes(options.labelFilter.value);
        if (!matchesLabel) return false;
      }
      return true;
    });
  });

  const getSortValue = (torrent: Torrent, prop: string) => {
    switch (prop) {
      case "name":
        return nameIndex.get(torrent.id) ?? torrent.name.toLowerCase();
      case "defaultTracker":
        return trackerIndex.get(torrent.id) ?? options.getDefaultTracker(torrent);
      case "peersDownloading":
        return getTrackerPeerCount(torrent, "seederCount");
      case "peersUploading":
        return getTrackerPeerCount(torrent, "leecherCount");
      case "speedLimit":
        return getActiveLimit(torrent);
      case "eta":
        return torrent.eta !== undefined && torrent.eta >= 0
          ? torrent.eta
          : Number.MAX_SAFE_INTEGER;
      case "downloadDir":
        return (torrent.downloadDir || "").toLowerCase();
      default:
        return (torrent as unknown as Record<string, unknown>)[prop] ?? 0;
    }
  };

  const displayedTorrents = computed(() => {
    const base = filteredTorrents.value;
    const { prop, order } = sortState.value;
    if (!prop || !order) return base;

    const direction = order === "ascending" ? 1 : -1;
    return base
      .map((torrent, index) => ({
        torrent,
        index,
        value: getSortValue(torrent, prop),
      }))
      .sort((left, right) => {
        const leftValue = left.value;
        const rightValue = right.value;
        let comparison: number;
        if (typeof leftValue === "string" && typeof rightValue === "string") {
          comparison = leftValue.localeCompare(rightValue);
        } else {
          comparison = Number(leftValue) - Number(rightValue);
        }
        return comparison === 0
          ? left.index - right.index
          : comparison * direction;
      })
      .map(({ torrent }) => torrent);
  });

  const paginatedTorrents = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return displayedTorrents.value.slice(start, start + pageSize.value);
  });

  let searchTimer: number | undefined;
  watch(searchKeyword, (value) => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      debouncedSearchKeyword.value = value;
      currentPage.value = 1;
    }, 300);
  });
  watch(
    [
      options.statusFilter,
      options.trackerFilter,
      options.categoryFilter,
      options.downloadDirFilter,
      options.errorTypeFilter,
      options.labelFilter,
    ],
    () => {
      currentPage.value = 1;
    }
  );
  watch(pageSize, () => {
    currentPage.value = 1;
  });
  watch(displayedTorrents, (items) => {
    const maxPage = Math.max(1, Math.ceil(items.length / pageSize.value));
    if (currentPage.value > maxPage) currentPage.value = maxPage;
  });
  onScopeDispose(() => window.clearTimeout(searchTimer));

  return {
    searchKeyword,
    sortState,
    currentPage,
    pageSize,
    pageSizeOptions,
    displayedTorrents,
    paginatedTorrents,
    updateIndexes,
    rebuildIndexes,
    removeIndexes,
  };
};
