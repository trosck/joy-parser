import path from 'path'

import { HTMLElement, parse } from 'node-html-parser'
import { SingleBar } from 'cli-progress'

import { fixPath, getImageId, makedirIfNotExist } from '@/core/utils'
import { ApiUtils, createAxiosInstance } from '@/core/axios'
import { MultiProgressBar } from '@/core/progress-bar'

export type Task = {
  link: string
  directory: string
  totalPages: number
  startPage: number
  // parse with negative rating
  isAll: boolean
  // parse from down to top
  isReverse: boolean
  downloadImagesInComments: boolean
}

class Parser {

  private axios: ApiUtils
  private categoryFolder = ''
  private unresolvedImages: string[] = []

  private multibar: MultiProgressBar
  private progressPageScrapping: SingleBar
  private progressArticlesOnPage: SingleBar
  private progressDownloadArticleImages: SingleBar

  constructor(private readonly SITE_URL: string) {
    this.SITE_URL = SITE_URL;
    this.axios = createAxiosInstance(SITE_URL)

    /** terminal progress bars */
    this.multibar = new MultiProgressBar();
    this.progressPageScrapping = this.multibar.create(0, 0, { name: 'Pages' });
    this.progressArticlesOnPage = this.multibar.create(0, 0, { name: 'Articles' });
    this.progressDownloadArticleImages = this.multibar.create(0, 0, { name: 'Article images' });
  }

  async start(task: Task) {
    const categoryTag = task.link.match(/tag\/([\w\+]+)/)?.[1]
    if (!categoryTag) {
      throw new Error('incorrect link: ' + task.link)
    }

    this.categoryFolder = path.join(
      __dirname,
      '..',
      task.directory,
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

    this.multibar.stop();

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

    const document = parse((await this.axios.get(`${url}/${page}`)).data)
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
        await this.axios.getImagesFromComments(
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
        await this.axios.downloadFile(src, this.categoryFolder, name)
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
