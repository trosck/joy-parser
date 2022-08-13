export interface IProgressBar {
  start(total: number, start: number, settings?: {}): void
  increment(step?: number, settings?: {}): void
}
