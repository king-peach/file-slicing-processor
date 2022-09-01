import { FileInfo, File, InstanceParams } from './type'
import SparkMD5 from 'spark-md5'

const isType = type => value => Object.prototype.toString.call(value) === `[object ${type}]`
const isObject = isType('Object')
const isFile = isType('File')

class FileSlicingProcessor {
  /* 文件分片阈值 */
  private chunkSize = 20 * 1024 * 1024
  /* 文件信息 */
  private fileInfo: Partial<FileInfo> = {}
  /* 已上传文件碎片数量 */
  private uploadedChunkNum: number = 0
  /* 上传错误回调 */
  private onError = null
  /* 上传完成回到函数 */
  private onFinished = null
  /* 上传进度回调函数 */
  private onProgress = null
  /* 文件md5进度回调函数 */
  private onFileMD5Progress = null
  /* 文件内容暂存 */
  private file = null

  constructor (file: File, options?: Partial<InstanceParams>) {
    if (isObject(options)) {
      const keys = ['onError', 'onFinished', 'onProgress', 'onFileMD5Progress', 'chunkSize', 'uploadedChunkNum']
      Object.keys(options).forEach(key => {
        if (options[key]) this[key] = options[key]
      })
    }

    if (!isFile(file)) {
      const error = new Error('param error: the file is not file type')
      typeof this.onError === 'function' && this.onError(error)
      return error as any
    }

    const md5 = `${file.name}-${file.size}-${file.lastModified}`
    const now = new Date().getTime()
    const id = SparkMD5.hash(now + md5)

    this.fileInfo = {
      id,
      md5,
      name: file.name,
      size: file.size,
      totalChunks: Math.ceil(file.size / this.chunkSize),
      uploadedChunks: this.uploadedChunkNum
    }

    if (this.uploadedChunkNum && this.uploadedChunkNum > this.fileInfo.totalChunks) {
      const error = new Error('The uploadedChunkNum parameter more than file chunk total!')
    }

    this.file = file
  }

  getFileRealMD5 () {
    return new Promise((resolve, reject) => {
      let spark = new SparkMD5.ArrayBuffer(),
          currChunk = 0
      const fileReader = new FileReader()

      fileReader.onload = e => {
        spark.append(e.target.result)
        currChunk++
        if (currChunk < this.fileInfo.totalChunks) {
          loadNext()
        } else {
          const md5 = spark.end()
          spark = null
          resolve(md5)
          this.fileInfo.md5 = md5
          this.onFileMD5Progress && this.onFileMD5Progress(Math.ceil(currChunk / this.fileInfo.totalChunks * 10 ** 4) / 10 ** 2)
        }
      }

      fileReader.onerror = err => reject(err)
    
      const loadNext = () => {
        fileReader.readAsArrayBuffer(this.handleFileSlice(currChunk, currChunk + 1))
        this.onFileMD5Progress && this.onFileMD5Progress(Math.ceil(currChunk / this.fileInfo.totalChunks * 10 ** 4) / 10 ** 2)
      }

      loadNext()
    })
  }

  getChunk () {
    const chunk = this.handleFileSlice(this.fileInfo.uploadedChunks, this.fileInfo.uploadedChunks + 1)
    return chunk
  }

  getChunkMD5 () {
    return new Promise((resolve, reject) => {
      const chunk = this.getChunk()
      const fileReader = new FileReader()
      let spark = new SparkMD5.ArrayBuffer()
  
      fileReader.onload = e => {
        spark.append(e.target.result)
        const result = spark.end()
        resolve(result)
        spark = null
      }
  
      fileReader.onerror = e => reject(e)
  
      fileReader.readAsArrayBuffer(chunk)
    })
  }

  next () {
    this.fileInfo.uploadedChunks++

    if (this.fileInfo.uploadedChunks === this.fileInfo.totalChunks) this.onFinished && this.onFinished(this.fileInfo)
    
    const progress = Math.ceil(this.fileInfo.uploadedChunks / this.fileInfo.totalChunks * 10 ** 4) / 10 ** 2
    this.onProgress && this.onProgress(progress)
  }

  private handleFileSlice (start, end) {
    if (end <= this.fileInfo.totalChunks) {
      return this.file.slice(start * this.chunkSize, end * this.chunkSize)
    }

    return null
  }

  reStart (num = 0) {
    this.fileInfo.uploadedChunks = num
  }
}

export default FileSlicingProcessor