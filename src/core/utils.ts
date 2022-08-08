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
 * @param {String} imagePath
 * full image name or src
 *
 * @returns {String} image id
 */
const getImageId = (imagePath: string) => imagePath.match(/(\d+.[\w]+)$/)?.[1]

const makedirIfNotExist = async (targetPath: string) => {
  try {
    await access(targetPath, fs.constants.W_OK)
  } catch (e) {
    await mkdir(targetPath)
  }
}

export {
  fixPath,
  getImageId,
  makedirIfNotExist
}