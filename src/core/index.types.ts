export interface Task {
  link: string
  dir: string
  total: number
  start: number
  // parse with negative rating
  all: boolean
  // parse from down to top
  reverse: boolean
  comments: boolean
}
