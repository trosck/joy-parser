import fs from 'fs'
import { access, mkdir } from 'fs/promises'
import path from 'path'

/**
 * Lowercase letters and replace
 * spaces by underscore
 *
 * @param {String} path
 * @returns {String}
 */
const fixPath = (path: string) => path?.replace(/\s/, '_')?.toLowerCase()

/**
 * Get image id from src
 *
 * @param {String} imageName
 * full image name or src
 *
 * @returns {String} image id
 */
const getImageId = (imageName: string) => imageName.match(/(\d+.[\w]+)$/)?.[1]

const makedirIfNotExist = async (targetPath: string) => {
  const directories = targetPath.split('/')

  const existedDirectories: string[] = []
  for (const directory of directories) {

    const directoryPath = path.resolve(
      existedDirectories.join(path.delimiter),
      directory
    )

    try {
      await access(directoryPath, fs.constants.W_OK)
    } catch (e) {
      await mkdir(directoryPath)
    }
  }
}

export {
  fixPath,
  getImageId,
  makedirIfNotExist
}