import { FileInfo, File, InstanceParams, HttpRequestParams } from './type'
import SparkMD5 from 'spark-md5'

const isType = type => value => Object.prototype.toString.call(value) === `[object ${type}]`
const isObject = isType('Object')
const isFile = isType('File')

class FileSlicingProcessor {
  /* 文件分片阈值 */
  #chunkSize = 20 * 1024 * 1024
  /* 文件信息 */
  #fileInfo: Partial<FileInfo> = {}
  /* 已上传文件碎片数量 */
  #uploadedChunkNum: number = 0
  /* 上传错误回调 */
  #onError = null
  /* 上传完成回到函数 */
  #onFinished = null
  /* 上传进度回调函数 */
  #onProgress = null
  /* 文件md5进度回调函数 */
  #onFileMD5Progress = null
  /* 自定义请求方法 */
  #httpRequest = null
  /* 文件内容暂存 */
  #file = null
  /* 状态 */
  #status = 'READY'
  /* 是否需要进行碎片MD5  */
  #chunkMD5 = false
  /* 重试次数 */
  #retryCount = 3

  constructor (file: File, options?: Partial<InstanceParams>) {
    if (isObject(options)) {
      if (options['httpRequest']) this.#httpRequest = options['httpRequest']
      if (options['onError']) this.#onError = options['onError']
      if (options['onFinished']) this.#onFinished = options['onFinished']
      if (options['onProgress']) this.#onProgress = options['onProgress']
      if (options['onFileMD5Progress']) this.#onFileMD5Progress = options['onFileMD5Progress']
      if (options['chunkSize']) this.#chunkSize = options['chunkSize']
      if (options['uploadedChunkNum']) this.#uploadedChunkNum = options['uploadedChunkNum']
      if (options['chunkMD5']) this.#chunkMD5 = options['chunkMd5']
      if (options['retryCount']) this.#retryCount = options['retryCount']
    }

    if (!isFile(file)) {
      const error = new Error('Parameter Error: the file is not file type')
      typeof this.#onError === 'function' && this.#onError(error)
      return error as any
    }

    const md5 = `${file.name}-${file.size}-${file.lastModified}`
    const now = new Date().getTime()
    const id = SparkMD5.hash(now + md5)

    this.#fileInfo = {
      id,
      md5,
      name: file.name,
      size: file.size,
      totalChunks: Math.ceil(file.size / this.#chunkSize),
      uploadedChunks: this.#uploadedChunkNum
    }

    if (this.#uploadedChunkNum && this.#uploadedChunkNum > this.#fileInfo.totalChunks) {
      const error = new Error('Error: The uploadedChunkNum parameter more than file chunk total!')
    }

    this.#file = file
  }

  #handleFileSlice (start, end) {
    if (end <= this.#fileInfo.totalChunks) {
      return this.#file.slice(start * this.#chunkSize, end * this.#chunkSize)
    }

    return null
  }

  getFileInfo () {
    return this.#fileInfo
  }

  getFileRealMD5 () {
    this.#status = 'MD5'
    return new Promise((resolve, reject) => {
      let spark = new SparkMD5.ArrayBuffer(),
          currChunk = 0
      const fileReader = new FileReader()

      fileReader.onload = e => {
        spark.append(e.target.result)
        currChunk++
        if (currChunk < this.#fileInfo.totalChunks) {
          loadNext()
        } else {
          const md5 = spark.end()
          spark = null
          this.#status = 'UPLOADING'
          this.#fileInfo.md5 = md5
          this.#onFileMD5Progress && this.#onFileMD5Progress(Math.ceil(currChunk / this.#fileInfo.totalChunks * 10 ** 4) / 10 ** 2)
          resolve(md5)
        }
      }

      fileReader.onerror = err => reject(err)
    
      const loadNext = () => {
        fileReader.readAsArrayBuffer(this.#handleFileSlice(currChunk, currChunk + 1))
        this.#onFileMD5Progress && this.#onFileMD5Progress(Math.ceil(currChunk / this.#fileInfo.totalChunks * 10 ** 4) / 10 ** 2)
      }

      loadNext()
    })
  }

  getChunk () {
    const chunk = this.#handleFileSlice(this.#fileInfo.uploadedChunks, this.#fileInfo.uploadedChunks + 1)
    return chunk
  }

  getChunkMD5 (): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunk = this.getChunk()
      if (!chunk) reject(new Error('Error: The file chunk is null: May be file slicing is done.'))
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

  async start (num = 0) {
    if (!this.#httpRequest) return new Error('Error: can not find http-request method!')

    if (this.#status === 'READY') this.#status = 'UPLOADING'

    if (this.#status === 'UPLOADING') {
      this.#fileInfo.uploadedChunks = num

      const chunk = this.getChunk()
      const param: HttpRequestParams = { chunk, chunkNum: this.#fileInfo.uploadedChunks }
      
      if (this.#chunkMD5) {
        param.chunkMD5 = await this.getChunkMD5()
      }

      try {
        await this.#httpRequest(param)
        // 自定义请求成功，自动开始进行下一步
        if (this.#retryCount !== 0) this.#retryCount = 0

        this.next()
        this.start(this.#fileInfo.uploadedChunks)
      } catch (e) {
        // 请求失败，开启重试机制
        if (this.#retryCount) {
          this.#retryCount--
          this.start(num)
        }
      }
    }
  }

  pause () {
    this.#status = 'PAUSE'
  }

  play () {
    this.start(this.#fileInfo.uploadedChunks)
  }

  done () {
    this.#status = 'DONE'
    this.#fileInfo.uploadedChunks = this.#fileInfo.totalChunks
  }

  next () {
    if (this.#fileInfo.uploadedChunks === this.#fileInfo.totalChunks) return

    this.#fileInfo.uploadedChunks++

    if (this.#fileInfo.uploadedChunks === this.#fileInfo.totalChunks) {
      this.#onFinished && this.#onFinished(this.#fileInfo)
      this.#status = 'DONE'
    }
    
    const progress = Math.ceil(this.#fileInfo.uploadedChunks / this.#fileInfo.totalChunks * 10 ** 4) / 10 ** 2
    this.#onProgress && this.#onProgress(progress)
  }
}

export default FileSlicingProcessor