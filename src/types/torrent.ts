export const TorrentStatusEnum = {
  STOPPED: 0,
  CHECK_WAIT: 1,
  CHECK: 2,
  DOWNLOAD_WAIT: 3,
  DOWNLOAD: 4,
  SEED_WAIT: 5,
  SEED: 6,
} as const

export type TorrentStatus = (typeof TorrentStatusEnum)[keyof typeof TorrentStatusEnum]

export interface TorrentTracker {
  id?: number
  announce: string
  scrape?: string
  tier?: number
}

export interface TorrentTrackerStat {
  announce: string
  host?: string
  seederCount?: number
  leecherCount?: number
  downloadCount?: number
  isBackup?: boolean
  lastAnnounceTime?: number
  lastAnnounceSucceeded?: boolean
  lastAnnouncePeerCount?: number
  nextAnnounceTime?: number
}

export interface TorrentFile {
  name: string
  length: number
  bytesCompleted: number
}

export interface TorrentFileStat {
  bytesCompleted?: number
  priority?: number
  wanted?: boolean
}

export interface TorrentPeer {
  address: string
  port: number
  clientName?: string
  progress: number
  rateToClient: number
  rateToPeer: number
  flagStr: string
}

export interface Torrent {
  id: number
  name: string
  status: TorrentStatus
  totalSize: number
  percentDone: number
  recheckProgress?: number
  rateDownload: number
  rateUpload: number
  uploadRatio: number
  eta?: number
  peersConnected?: number
  peersSendingToUs?: number
  peersGettingFromUs?: number
  addedDate: number
  doneDate?: number
  error?: number
  errorString?: string
  downloadDir: string
  hashString: string
  uploadedEver?: number
  downloadedEver?: number
  activityDate?: number
  labels?: string[]
  category?: string
  trackers?: TorrentTracker[]
  trackerStats?: TorrentTrackerStat[]
  comment?: string
  creator?: string
  pieceCount?: number
  pieceSize?: number
  dateCreated?: number
  files?: TorrentFile[]
  fileStats?: TorrentFileStat[]
  isPrivate?: boolean
  downloadLimit?: number
  uploadLimit?: number
  downloadLimited?: boolean
  uploadLimited?: boolean
  bandwidthPriority?: number
  webseeds?: string[]
  peers?: TorrentPeer[]
  popularity?: number
}
