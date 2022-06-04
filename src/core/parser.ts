import path from 'path'

import { HTMLElement, parse } from 'node-html-parser'

import { fixPath, getImageId, makedirIfNotExist } from '@/core/utils'
import { ApiUtils, createAxiosInstance } from '@/core/api-utils'
import { IProgressBar } from './progress-bar-type'

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

class Parser {

  private apiUtils: ApiUtils
  private categoryFolder = ''
  private unresolvedImages: string[] = []

  constructor(
    SITE_URL: string,
    private readonly progressPageScrapping: IProgressBar,
    private readonly progressArticlesOnPage: IProgressBar
  ) {
    this.apiUtils = createAxiosInstance(SITE_URL)
  }

  async start(task: Task) {
    const categoryTag = task.link.match(/tag\/([\w\+]+)/)?.[1]
    if (!categoryTag) {
      throw new Error('incorrect link: ' + task.link)
    }

    this.categoryFolder = path.join(
      __dirname,
      '..',
      task.directoryToSave,
      fixPath(categoryTag)
    )

    console.log(this.categoryFolder);

    await makedirIfNotExist(this.categoryFolder)

    this.progressPageScrapping.start(task.totalPages, 0)
    let page = task.startPage

    while (true) {
      const countParsingPage = page - task.startPage
      if ((countParsingPage) === task.totalPages) break

      const result = await this.parsePage(task, page)
      if (!result) break

      this.progressPageScrapping.increment()
      page++
    }

    console.log();
    console.log('done!');

    if (this.unresolvedImages.length) {
      console.log('some images not downloaded:');
      this.unresolvedImages.splice(0).forEach(console.log);
    }
  }

  async parsePage(task: Task, page = task.startPage) {
    let url = task.link

    if (task.isAll) url += '/all'

    const document = parse((await this.apiUtils.get(`${url}/${page}`)).data)
    const articles: HTMLElement[] = Array.from(
      document.querySelectorAll('.postContainer .article')
    )

    if (!articles.length) return null;

    /** order by date */
    if (task.isReverse) articles.reverse()

    this.progressArticlesOnPage.start(articles.length, 0)
    for (let articleIndex = 0; articleIndex < articles.length; articleIndex++) {
      await this.parseArticle(articles[articleIndex], articleIndex, page, task)
      this.progressArticlesOnPage.increment()
    }

    return true;
  }

  async parseArticle(
    article: HTMLElement,
    articleIndex: number,
    pageIndex: number,
    task: Task
  ) {
    const articleImages = Array.from(article.querySelectorAll('.image img'));

    /** add images from comments to download */
    if (task.downloadImagesInComments) {
      
      Array.prototype.push.apply(
        articleImages,
        await this.apiUtils.getImagesFromComments(
          this.getArticleId(article)
        )
      )
    }

    this.progressDownloadArticleImages.start(articleImages.length, 0);
    for (let imageIndex = 0; imageIndex < articleImages.length; imageIndex++) {
      const image = articleImages[imageIndex];
      const src = image.getAttribute('src')

      if (!src) continue

      const name = `${pageIndex}_${articleIndex + 1}_${imageIndex + 1}_${getImageId(src)}`;

      try {
        await this.apiUtils.downloadFile(src, this.categoryFolder, name)
      } catch (e) {
        this.unresolvedImages.push(src)
      } finally {
        this.progressDownloadArticleImages.increment();
      }
    }
  }

  private getArticleId(article: HTMLElement) {
    return article
      ?.querySelector('a.link')
      ?.getAttribute('href')
      ?.match(/\/(\d+)/)?.[1]
  }
}

export default Parser
