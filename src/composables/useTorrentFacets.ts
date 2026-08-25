import { computed, type Ref } from "vue";
import type { Torrent } from "@/types/transmission";
import { getTrackerDisplayName, getTrackerHost } from "@/utils/torrent";

interface TorrentFacetOptions {
  torrents: Ref<Torrent[]>;
  noCategoryLabel: () => string;
  isTorrentError: (torrent: Torrent) => boolean;
  getErrorType: (error?: string) => string;
}

interface SelectOption {
  label: string;
  value: string;
}

export interface TrackerOption extends SelectOption {
  displayName: string;
  host: string;
}

/** Builds all list-filter facets in a single pass over the torrent collection. */
export const useTorrentFacets = (options: TorrentFacetOptions) => {
  const facets = computed(() => {
    const ordinaryLabels = new Set<string>();
    const allLabels = new Map<string, SelectOption>();
    const trackers = new Map<string, TrackerOption>();
    const categories = new Set<string>();
    const downloadDirs = new Set<string>();
    const errorTypes = new Set<string>();
    let hasNoLabelTorrent = false;
    let hasUncategorizedTorrent = false;

    for (const torrent of options.torrents.value) {
      const labels = torrent.labels ?? [];
      let hasOrdinaryLabel = false;
      for (const raw of labels) {
        if (!raw.startsWith("category:")) {
          hasOrdinaryLabel = true;
          ordinaryLabels.add(raw);
        }
        if (!allLabels.has(raw)) {
          allLabels.set(raw, {
            label: raw.startsWith("category:")
              ? raw.slice("category:".length)
              : raw,
            value: raw,
          });
        }
      }
      if (!hasOrdinaryLabel) hasNoLabelTorrent = true;

      if (torrent.category) categories.add(torrent.category);
      else hasUncategorizedTorrent = true;
      if (torrent.downloadDir) downloadDirs.add(torrent.downloadDir);
      if (options.isTorrentError(torrent)) {
        errorTypes.add(options.getErrorType(torrent.errorString));
      }

      const trackerList = torrent.trackers ?? [];
      const recognized = trackerList.find((tracker) => {
        const displayName = getTrackerDisplayName(tracker.announce);
        return displayName !== getTrackerHost(tracker.announce);
      });
      const chosen = recognized ?? trackerList[0];
      if (chosen) {
        const displayName = getTrackerDisplayName(chosen.announce);
        const host = getTrackerHost(chosen.announce);
        if (!trackers.has(displayName)) {
          trackers.set(displayName, {
            label: displayName !== host ? `${displayName} (${host})` : host,
            value: displayName,
            displayName,
            host,
          });
        }
      }
    }

    const categoryValues = [...categories].sort();
    if (hasUncategorizedTorrent) {
      categoryValues.unshift(options.noCategoryLabel());
    }

    return {
      availableLabels: [...ordinaryLabels]
        .sort()
        .map((label) => ({ label, value: label })),
      labelOptions: [...allLabels.values()].sort((left, right) =>
        left.label.localeCompare(right.label)
      ),
      hasNoLabelTorrent,
      trackerOptions: [...trackers.values()].sort((left, right) =>
        left.label.localeCompare(right.label)
      ),
      categoryOptions: categoryValues.map((category) => ({
        label: category,
        value: category,
      })),
      downloadDirs: [...downloadDirs].sort((left, right) =>
        left.localeCompare(right)
      ),
      errorTypeOptions: [...errorTypes]
        .sort()
        .map((type) => ({ label: type, value: type })),
    };
  });

  return {
    availableLabelsOptions: computed(() => facets.value.availableLabels),
    labelOptions: computed(() => facets.value.labelOptions),
    hasNoLabelTorrent: computed(() => facets.value.hasNoLabelTorrent),
    trackerOptions: computed(() => facets.value.trackerOptions),
    categoryOptions: computed(() => facets.value.categoryOptions),
    downloadDirs: computed(() => facets.value.downloadDirs),
    downloadDirOptions: computed(() =>
      facets.value.downloadDirs.map((dir) => ({ label: dir, value: dir }))
    ),
    errorTypeOptions: computed(() => facets.value.errorTypeOptions),
  };
};
