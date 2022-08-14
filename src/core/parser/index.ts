import EventEmitter from 'events'
import { parse } from 'node-html-parser'

import { getImageId, getArticleId } from 'core/utils'
import { Api, createAxiosInstance } from 'core/api'
import { Task } from 'core/index.types'

export class Parser {

  private api: Api
  private images: Array<{ src: string, name: string }> = []
  public events: EventEmitter

  constructor(baseUrl: string) {
    this.events = new EventEmitter()
    this.api = createAxiosInstance(baseUrl)
  }

  public async parse(task: Task) {
    const categoryTag = task.link.match(/tag\/([\w\+]+)/)?.[1]
    if (!categoryTag) {
      throw new Error(`Incorrect link on category "${task.link}"`)
    }

    this.events.emit('startParsingPages')

    let page = task.start
    while (true) {

      const countParsingPage = page - task.start
      if ((countParsingPage) === task.total) break

      const result = await this.parsePage(task, page)
      if (!result) break

      this.events.emit('pageProcessed', countParsingPage, page)

      page++
    }

    this.events.emit('endParsingPages')

    return this.images.splice(0)
  }

  private async parsePage(task: Task, page = task.start) {
    let url = task.link

    if (task.all) url += '/all'

    const document = parse((await this.api.get(`${url}/${page}`)).data)
    const articles = Array.from(
      document.querySelectorAll('.postContainer .article')
    )

    if (!articles.length) return null;

    /** order by date */
    if (task.reverse) articles.reverse()

    this.events.emit('startParsingArticles')

    for (let articleIndex = 0; articleIndex < articles.length; articleIndex++) {
      const article = articles[articleIndex] as unknown as Element
      await this.parseArticle(
        article,
        articleIndex,
        page,
        task
      )

      this.events.emit('articleParsed', articleIndex + 1, articles.length)
    }

    this.events.emit('endParsingArticles')

    return true;
  }

  private async parseArticle(
    article: Element,
    articleIndex: number,
    pageIndex: number,
    task: Task
  ) {
    const articleImages = Array.from(article.querySelectorAll('.image img'));

    /** add images from comments to download */
    if (task.comments) {
      Array.prototype.push.apply(
        articleImages,
        await this.api.getImagesFromComments(
          getArticleId(article)
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
}
