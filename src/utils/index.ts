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

export {
  fixPath,
  getImageId
}