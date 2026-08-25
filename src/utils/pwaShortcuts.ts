type StandaloneNavigator = Navigator & { standalone?: boolean }

export function isPwaMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as StandaloneNavigator).standalone === true
  )
}
