import path from 'path'
import { retryOnError } from '@trosckey/scraper-utils'
import { Task } from 'core/index.types'
import { Parser } from 'core/parser'
import { Api, createAxiosInstance } from 'core/api'
import { makedirIfNotExist } from 'core/utils'
import EventEmitter from 'events'

class Scraper {
  private parser: Parser

  parserEvents: EventEmitter
  events: EventEmitter
  api: Api

  constructor(baseUrl: string) {
    this.parser = new Parser(baseUrl)
    this.parserEvents = this.parser.events
    this.api = createAxiosInstance(baseUrl)
    this.events = new EventEmitter()
  }

  async parse(task: Task) {

    await makedirIfNotExist(path.resolve(task.dir))
    const images = await this.parser.parse(task)

    this.events.emit('imagesParsed', images.length)

    const unresolvedImages: string[] = []

    for (const { src, name } of images ) {
      await retryOnError(
        async () => {
          await this.api.downloadFile(
            src,
            task.dir,
            name
          )
        }, 3, () => {
          unresolvedImages.push(src)
        }
      )
    }

    this.events.emit('unresolvedImages', [...unresolvedImages])
  }
}

export { Scraper }
