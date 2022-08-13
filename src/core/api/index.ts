import path from 'path'
import fs from 'fs'

import { Axios } from 'axios'
import { HTMLElement, parse } from 'node-html-parser'

class Api extends Axios {

  /**
   * returns array image sources from comments
   *
   * @param postId
   * @returns
   */
  async getImagesFromComments(
    postId: string | number | undefined
  ): Promise<string[]> {

    if (!postId) return []

    const { data } = await this.get(
      `/post/comments/${postId}?_=${Date.now()}`
    )

    const images: HTMLElement[] = Array.from(
      parse(data).querySelectorAll('.image img')
    )

    if (!images.length) return []

    return images.map(
      el => el.getAttribute('src') ?? ''
    )
      .filter(el => el.length)
  }

  /**
   * downloads file to the specified
   * folder with the given name
   *
   * @param fileUrl
   * @param downloadFolder
   * @param fileName
   */
  async downloadFile(
    fileUrl: string,
    downloadFolder: string,
    fileName: string
  ) {
    const localFilePath = path.resolve(downloadFolder, fileName);

    try {
      const response = await this.get(
        fileUrl,
        {
          responseType: 'stream'
        }
      )

      response.data.pipe(fs.createWriteStream(localFilePath))
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

function createAxiosInstance(baseURL: string) {
  return new Api({
    baseURL,
    timeout: 30000,
    headers: {
      'Referer': baseURL,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'User-Agent': 'Mozilla/5.0',
    }
  })
}

export {
  Api,
  createAxiosInstance
}
