import { MultiProgressBar } from '@/core/cli-progress-bar'
import { IProgressBar } from '@/types/progress-bar'

type factoryProgressBarReturn = {
  progressPageScrapping: IProgressBar
  progressArticlesOnPage: IProgressBar
}

export function createProgressBar(name: string) {
  const multibar = new MultiProgressBar()
  return multibar.create(0, 0, { name })
}

export function factoryProgressBar(type: 'cli' | 'ui'): factoryProgressBarReturn {
  switch(type) {
    case 'cli': {
      const multibar = new MultiProgressBar()
      return {
        progressPageScrapping: multibar.create(0, 0, { name: 'Pages' }),
        progressArticlesOnPage: multibar.create(0, 0, { name: 'Articles' })
      }
    }

    // case 'ui': {
    //   return {
    //     progressPageScrapping
    //     progressArticlesOnPage
    //     progressDownloadArticleImages
    //   }
    // }

    default:
      throw new Error('unknow type')
  }
}
