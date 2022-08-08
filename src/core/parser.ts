import path from 'path'

import { HTMLElement, parse } from 'node-html-parser'

import { fixPath, getImageId, makedirIfNotExist } from '@/core/utils'
import { ApiUtils, createAxiosInstance } from '@/core/api-utils'
import { IProgressBar } from '@/types/progress-bar'
import { Task } from '@/types/task'

export class Parser {

  private categoryFolder = ''
  private images: Array<{ src: string, name: string }> = []

  constructor(
    private readonly apiUtils: ApiUtils,
    private readonly progressPageScrapping?: IProgressBar,
    private readonly progressArticlesOnPage?: IProgressBar
  ) {
  }

  async parse(task: Task) {
    const categoryTag = task.link.match(/tag\/([\w\+]+)/)?.[1]
    if (!categoryTag) {
      throw new Error('incorrect link: ' + task.link)
    }

    this.categoryFolder = path.resolve(
      task.directoryToSave,
      fixPath(categoryTag)
    )

    await makedirIfNotExist(this.categoryFolder)

    this.progressPageScrapping?.start(task.totalPages, 0)
    let page = task.startPage

    while (true) {
      const countParsingPage = page - task.startPage
      if ((countParsingPage) === task.totalPages) break

      const result = await this.parsePage(task, page)
      if (!result) break

      this.progressPageScrapping?.increment()
      page++
    }

    return this.images.splice(0)
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

    this.progressArticlesOnPage?.start(articles.length, 0)
    for (let articleIndex = 0; articleIndex < articles.length; articleIndex++) {
      await this.parseArticle(articles[articleIndex], articleIndex, page, task)
      this.progressArticlesOnPage?.increment()
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

    for (let imageIndex = 0; imageIndex < articleImages.length; imageIndex++) {
      const image = articleImages[imageIndex];
      const src = image.getAttribute('src')

      if (!src) continue

      const name = `${pageIndex}_${articleIndex + 1}_${imageIndex + 1}_${getImageId(src)}`;
      this.images.push({ src, name })
    }
  }

  private getArticleId(article: HTMLElement) {
    return article
      ?.querySelector('a.link')
      ?.getAttribute('href')
      ?.match(/\/(\d+)/)?.[1]
  }
}
