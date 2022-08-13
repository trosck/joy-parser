export interface Task {
  link: string
  directoryToSave: string
  totalPages: number
  startPage: number
  // parse with negative rating
  isAll: boolean
  // parse from down to top
  isReverse: boolean
  downloadImagesInComments: boolean
}
