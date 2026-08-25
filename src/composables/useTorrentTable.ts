import { computed, h, onScopeDispose, type Ref } from "vue";
import {
  ElCheckbox,
  ElProgress,
  ElTag,
  ElTooltip,
  TableV2SortOrder,
  type CheckboxValueType,
  type Column,
  type ColumnResizeHandler,
  type ColumnSortHandler,
  type SortBy,
} from "element-plus";
import type { Torrent } from "@/types/transmission";
import type { TorrentSortOrder } from "@/composables/useTorrentListQuery";
import { formatBytes, formatSpeed } from "@/utils/format";

export interface TorrentColumnConfig {
  key: string;
  label: string;
  prop?: string;
  sortable?: boolean;
  minWidth?: number;
  defaultWidth?: number;
  showInCompact?: boolean;
}

interface SpeedLimitInfo {
  text: string;
  tooltip: string;
  active: boolean;
}

interface TorrentTableOptions {
  visibleColumns: Ref<TorrentColumnConfig[]>;
  compact: Ref<boolean>;
  sortState: Ref<{ prop: string; order: TorrentSortOrder }>;
  selectedIds: Ref<readonly number[]>;
  allSelected: Ref<boolean>;
  indeterminate: Ref<boolean>;
  isSelected: (id: number) => boolean;
  togglePage: (selected: boolean) => void;
  toggleRow: (torrent: Torrent, selected: boolean) => void;
  handleRowClick: (torrent: Torrent, event: MouseEvent) => void;
  handleRowDoubleClick: (torrent: Torrent) => void;
  handleRowContextMenu: (torrent: Torrent, event: MouseEvent) => void;
  getColumnWidth: (key: string, fallback?: number) => number;
  resizeColumn: (width: number, key: string, minWidth?: number) => void;
  getStatusType: (torrent: Torrent) => string;
  getStatusText: (torrent: Torrent) => string;
  isTorrentError: (torrent: Torrent) => boolean;
  getProgress: (torrent: Torrent) => number;
  getProgressTooltip: (torrent: Torrent) => string;
  getRatioClass: (ratio: number) => string;
  formatRatio: (ratio: number) => string;
  formatSpeedLimit: (torrent: Torrent) => SpeedLimitInfo;
  openSpeedLimit: (torrent: Torrent) => void;
  getDefaultTracker: (torrent: Torrent) => string;
  getSeeders: (torrent: Torrent) => string;
  getLeechers: (torrent: Torrent) => string;
  formatDate: (timestamp?: number) => string;
  formatLastActivity: (timestamp?: number) => string;
  unknownErrorText: () => string;
}

/** Adapts the torrent domain model to Element Plus' virtual-table contract. */
export const useTorrentTable = (options: TorrentTableOptions) => {
  const sortBy = computed<SortBy | undefined>(() => {
    if (!options.sortState.value.order) return undefined;
    return {
      key: options.sortState.value.prop,
      order:
        options.sortState.value.order === "ascending"
          ? TableV2SortOrder.ASC
          : TableV2SortOrder.DESC,
    };
  });

  const handleSort: ColumnSortHandler<Torrent> = ({ key, order }) => {
    options.sortState.value = {
      prop: String(key || ""),
      order:
        order === TableV2SortOrder.ASC ? "ascending" : "descending",
    };
  };

  const handleResize: ColumnResizeHandler<Torrent> = (column, width) =>
    options.resizeColumn(width, String(column.key), column.minWidth);

  let removeDragListeners: (() => void) | undefined;
  let resizeFrame: number | undefined;
  const startColumnResize = (
    event: MouseEvent,
    column: { key: string; width?: number; minWidth?: number }
  ) => {
    event.preventDefault();
    event.stopPropagation();
    removeDragListeners?.();

    const startX = event.clientX;
    const startWidth = column.width || 80;
    let latestX = startX;
    const applyResize = () => {
      resizeFrame = undefined;
      const width = Math.max(
        column.minWidth || 50,
        startWidth + latestX - startX
      );
      options.resizeColumn(width, column.key, column.minWidth);
    };
    const onMouseMove = (moveEvent: MouseEvent) => {
      latestX = moveEvent.clientX;
      if (resizeFrame === undefined) {
        resizeFrame = window.requestAnimationFrame(applyResize);
      }
    };
    const onMouseUp = () => removeDragListeners?.();

    removeDragListeners = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = undefined;
      document.body.style.cursor = "";
      removeDragListeners = undefined;
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
  };
  onScopeDispose(() => removeDragListeners?.());

  const renderHeader = (props: any) =>
    h(
      "div",
      {
        class: "el-table-v2__header-cell-text",
        style: {
          height: "100%",
          display: "flex",
          alignItems: "center",
          width: "100%",
        },
      },
      [
        h(
          "span",
          {
            class: "torrent-column-title",
            title: props.column.title,
          },
          props.column.title
        ),
        props.column.sortable
          ? h(
              "span",
              {
                class: {
                  "el-table-v2__sort-icon": true,
                  "custom-sort-icon": true,
                  "is-sorted": props.sortBy?.key === props.column.key,
                },
              },
              [
                h("i", {
                  class: { "sort-caret": true, ascending: true },
                  style: {
                    borderBottomColor:
                      props.sortBy?.key === props.column.key &&
                      props.sortBy?.order === "asc"
                        ? "#409eff"
                        : "#c0c4cc",
                  },
                }),
                h("i", {
                  class: { "sort-caret": true, descending: true },
                  style: {
                    borderTopColor:
                      props.sortBy?.key === props.column.key &&
                      props.sortBy?.order === "desc"
                        ? "#409eff"
                        : "#c0c4cc",
                  },
                }),
              ]
            )
          : null,
        h("div", {
          class: "el-table-v2__column-resizer",
          onMousedown: (event: MouseEvent) =>
            startColumnResize(event, props.column),
          onClick: (event: MouseEvent) => event.stopPropagation(),
        }),
      ]
    );

  const renderCell = (column: TorrentColumnConfig, row: Torrent) => {
    switch (column.key) {
      case "name":
        return h("span", { class: "torrent-cell-ellipsis", title: row.name }, row.name);
      case "status": {
        const tag = h(ElTag, { type: options.getStatusType(row) as any }, () =>
          options.getStatusText(row)
        );
        return options.isTorrentError(row)
          ? h(
              ElTooltip,
              {
                content: row.errorString || options.unknownErrorText(),
                placement: "top",
              },
              () => tag
            )
          : tag;
      }
      case "percentDone": {
        const progress = options.getProgress(row);
        const bar = h(ElProgress, {
          percentage: Math.round(progress * 100),
          status: progress === 1 ? "success" : undefined,
        });
        return h(
          ElTooltip,
          {
            content: options.getProgressTooltip(row),
            disabled: progress === 1,
            placement: "top",
          },
          () => bar
        );
      }
      case "totalSize":
        return h("span", formatBytes(row.totalSize));
      case "uploadRatio":
        return h(
          ElTag,
          {
            size: "small",
            class: ["ratio-tag", options.getRatioClass(row.uploadRatio)],
          },
          () => options.formatRatio(row.uploadRatio)
        );
      case "rateDownload":
        return h("span", formatSpeed(row.rateDownload));
      case "rateUpload":
        return h("span", formatSpeed(row.rateUpload));
      case "speedLimit": {
        const info = options.formatSpeedLimit(row);
        const cell = h(
          "span",
          {
            class: ["limit-cell", info.active ? "active" : ""],
            title: info.active ? info.tooltip : undefined,
            onClick: (event: Event) => {
              event.stopPropagation();
              options.openSpeedLimit(row);
            },
          },
          info.text
        );
        return info.active
          ? h(ElTooltip, { content: info.tooltip, placement: "top" }, () => cell)
          : cell;
      }
      case "defaultTracker":
        return h("span", options.getDefaultTracker(row));
      case "peersDownloading":
        return h("span", options.getSeeders(row));
      case "peersUploading":
        return h("span", options.getLeechers(row));
      case "uploadedEver":
        return h("span", formatBytes(row.uploadedEver || 0));
      case "downloadDir":
        return h(
          "span",
          { class: "torrent-cell-ellipsis", title: row.downloadDir || "—" },
          row.downloadDir || "—"
        );
      case "addedDate":
        return h("span", options.formatDate(row.addedDate));
      case "activityDate":
        return h(
          "span",
          { title: options.formatDate(row.activityDate) },
          options.formatLastActivity(row.activityDate)
        );
      case "labels":
        return row.labels?.length
          ? h(
              "div",
              { class: "torrent-labels" },
              row.labels.map((label) =>
                h(ElTag, { size: "small", class: "label-tag" }, () =>
                  label.startsWith("category:")
                    ? label.slice("category:".length)
                    : label
                )
              )
            )
          : h("span", "—");
      case "category":
        return h("span", row.category || "—");
      default:
        return h("span", "—");
    }
  };

  const columns = computed<Column<Torrent>[]>(() => {
    // Element Plus Table V2 reuses rendered rows while data is unchanged.
    // Make selection an explicit column-model dependency so programmatic
    // clears and range changes are reflected immediately.
    void options.selectedIds.value;
    const selectionColumn: Column<Torrent> = {
      key: "selection",
      width: 48,
      fixed: true,
      align: "center",
      headerCellRenderer: () =>
        h(ElCheckbox, {
          modelValue: options.allSelected.value,
          indeterminate: options.indeterminate.value,
          "onUpdate:modelValue": (value: CheckboxValueType) =>
            options.togglePage(Boolean(value)),
        }),
      cellRenderer: ({ rowData }) =>
        h(ElCheckbox, {
          modelValue: options.isSelected(rowData.id),
          "onUpdate:modelValue": (value: CheckboxValueType) =>
            options.toggleRow(rowData, Boolean(value)),
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            if (event.shiftKey) {
              event.preventDefault();
              options.handleRowClick(rowData, event);
            }
          },
        }),
    };

    const dataColumns = options.visibleColumns.value
      .filter((column) => column.showInCompact || !options.compact.value)
      .map<Column<Torrent>>((column) => ({
        key: column.key,
        dataKey: column.key,
        title: column.label,
        width: options.getColumnWidth(column.key, column.defaultWidth),
        sortable: column.sortable,
        resizable: true,
        minWidth: column.minWidth,
        headerCellRenderer: renderHeader,
        cellRenderer: ({ rowData }) => renderCell(column, rowData),
      }));
    return [selectionColumn, ...dataColumns];
  });

  const rowEventHandlers = {
    onClick: ({ rowData, event }: { rowData: Torrent; event: Event }) =>
      options.handleRowClick(rowData, event as MouseEvent),
    onDblclick: ({ rowData }: { rowData: Torrent }) =>
      options.handleRowDoubleClick(rowData),
    onContextmenu: ({ rowData, event }: { rowData: Torrent; event: Event }) =>
      options.handleRowContextMenu(rowData, event as MouseEvent),
  };
  const rowClassName = ({
    rowData,
    rowIndex,
  }: {
    rowData: Torrent;
    rowIndex: number;
  }) => {
    const classes = [];
    if (rowIndex % 2 === 1) classes.push("el-table-v2__row--striped");
    if (options.isSelected(rowData.id)) classes.push("current-row");
    return classes.join(" ");
  };

  return {
    columns,
    sortBy,
    handleSort,
    handleResize,
    rowEventHandlers,
    rowClassName,
  };
};
