import path from 'path'
import fs from 'fs'

import axios, { Axios, AxiosRequestConfig } from 'axios'
import { parse } from 'node-html-parser'

class ApiUtils extends Axios {

  /**
   * returns array image sources from comments
   *
   * @param postId
   * @returns
   */
  getImagesFromComments = async (postId: string | number) => {
    const { data } = await this.get(
      `/post/comments/${postId}?_=${Date.now()}`
    )

    return Array.from(
      parse(data)
        .querySelectorAll('.image img')
    )
      .map(imageEl => imageEl.getAttribute('src'))
  }

  /**
   * downloads file to the specified
   * folder with the given name
   *
   * @param fileUrl
   * @param downloadFolder
   * @param fileName
   */
  downloadFile = async (
    fileUrl: string,
    downloadFolder: string,
    fileName: string
  ) => {
    const localFilePath = path.resolve(__dirname, downloadFolder, fileName);
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
  return new ApiUtils({
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
  createAxiosInstance
}
