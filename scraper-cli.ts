import cli from 'cli'
import { Scraper } from './src/index'

cli.enable('version', 'status')

// How it works: https://www.npmjs.com/package/cli#command-line-arguments-parser
const options = cli.parse({
  link: [
    'l', 'Link on category to parse', 'url'
  ],
  dir: [
    'd', 'Directory to save', 'string', 'images'
  ],
  start: [
    's', 'Start page(optional if page number in url)', 'int'
  ],
  total: [
    't', 'Total pages(count)', 'int', 1
  ],
  all: [
    'a', 'Parse articles with negative rating', 'on'
  ],
  reverse: [
    'r', 'Parse articles by date(from down to top)', 'on'
  ],
  comments: [
    'c', 'Parse images in comments', 'on'
  ]
})

const { origin, pathname } = new URL(options.link)
const scraper = new Scraper(origin)

const pageNumberFromUrl = pathname.match(/\/(\d+)$/)?.[1]
if (pageNumberFromUrl) {
  options.start = pageNumberFromUrl
}

scraper.events.on(
  'unresolvedImages',
  images => {
    if (images.length) {
      cli.error(`Some images (${images.length}) were not downloaded: ${images}`)
    }
  }
)

scraper.parserEvents.on(
  'startParsingPages',
  () => {
    console.log()
    cli.info('Start parsing...')
  }
)

scraper.parserEvents.on(
  'endParsingPages',
  () => {
    console.log()
    cli.ok('All pages parsed')
  }
)

scraper.parserEvents.on(
  'articleParsed',
  (article, articlesCount, page) => {
    const pageCount = page - options.start
    cli.progress(
      (pageCount / options.total) + (article / articlesCount) / options.total
    )
  }
)

scraper.events.on(
  'imagesParsed',
  count => cli.ok(`Found ${count} images`)
)

scraper.events.on(
  'startImagesDownloading',
  () => cli.info('Start downloading images')
)

scraper.events.on(
  'imageProcessed',
  (processedImages, imagesCount) => {
    cli.progress(processedImages / imagesCount)
  }
)

scraper.events.on(
  'endImagesDownloading',
  () => console.log('\n')
)

await scraper.parse(options)
