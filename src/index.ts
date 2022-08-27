import { FileInfo, File, InstanceParams } from './type'

const isType = type => value => Object.prototype.toString.call(value) === `[object ${type}]`
const isObject = isType('Object')
const isFile = isType('File')

class FileSlicingProcessor {
  /* 文件分片阈值 */
  private chunkSize = 20 * 1024 * 1024
  /* 是否需要进行文件md5 */
  private fileMd5 = false
  /* 是否需要进行文件碎片md5 */
  private chunkMd5 = false
  /* 文件信息 */
  private fileInfo: Partial<FileInfo> = {}

  private onError = null

  private onFinished = null

  private onProgress = null

  private file = null

  constructor (file: File, params?: Partial<InstanceParams>) {
    if (isObject(params)) {
      const keys = ['onError', 'onFinished', 'onProgress', 'chunkSize', 'fileMd5', 'chunkMd5']
      Object.keys(params).forEach(key => {
        if (params[key]) this[key] = params[key]
      })
    }

    if (!isFile(file)) {
      const error = new Error('param error: the file is not file type')
      typeof this.onError === 'function' && this.onError(error)
      return error as any
    }

    this.fileInfo = {
      name: file.name,
      size: file.size,
      totalChunks: Math.ceil(file.size / this.chunkSize),
      md5: `${file.name}-${file.size}-${file.lastModified}`,
      uploadedChunks: 0
    }

    this.file = file
  }

  getChunk () {
    const chunk = this.handleFileSlice(this.fileInfo.uploadedChunks, this.fileInfo.uploadedChunks + 1)
    return chunk
  }

  next () {
    this.fileInfo.uploadedChunks++

    if (this.fileInfo.uploadedChunks === this.fileInfo.totalChunks) this.onFinished(this.fileInfo)
    
    const progress = Math.ceil(this.fileInfo.uploadedChunks / this.fileInfo.totalChunks * 10 ** 4) / 10 ** 2
    this.onProgress(progress)
  }

  private handleFileSlice (start, end) {
    if (end <= this.fileInfo.totalChunks) {
      return this.file.slice(start * this.chunkSize, end * this.chunkSize)
    }

    return null
  }

  reStart () {
    this.fileInfo.uploadedChunks = 0
  }
}

export default FileSlicingProcessor