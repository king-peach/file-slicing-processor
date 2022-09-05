file-slicing-processor
==

### 场景
---

主要用来处理web端文件分片上传过程中文件分片的过程，提供文件切片，进度条（上传进度、文件md5进度），输出文件碎片等功能（支持TS）

通过以上功能可实现文件分片上传、断点续传、秒传等文件上传操作

### 安装
---

```sh
npm install file-slicing-processor
```

### 快速上手
---

1. 简单文件分片上传业务场景

```javascript
  import FileSlicingProcessor from 'file-slicing-processor'

  const file = document.querySelector('#file').files[0]
  let done = false

  const processor = new FileSlicingProcessor(file, {
    chunkSize: 100 * 1024 * 1024,
    onProgress (progress) {
      console.log(`uplaod progress is ${progress}`)
    },
    onFinished (fileInfo) {
      console.log(`the file upload done, the file info is `, fileInfo)
      done = true
    },
    onError (err) {
      console.error(`file upload error, err: `, err)
    },
    httpRequest (params) {
      // 自定义请求必须返回一个Promise结果
      return axios.post(`/file/upload`, params)
    }
  });
```

2. 大文件秒传和断点续传业务场景

 ```javascript
 import FileSlicingPorcessor from 'file-slicing-processor'

const file = document.querySelector('#file').files[0]
let done = false

const processor = new FileSlicingProcessor(file, {
  onProgress (progress) {
    console.log(`uplaod progress is ${progress}`)
  },
  onFinished (fileInfo) {
    console.log(`the file upload done, the file info is`, fileInfo)
    done = true
  },
  onError (err) {
    console.error(`file upload error, err: `, err)
  },
  onFileMD5Progress (progress) {
    console.log(`file md5 progress is ${progress}`)
  },
  httpRequest (params) {
    return axios.post(`/file/upload`, params)
  }
})

processor.getFileRealMD5().then(async md5 => {
  console.log(`file real md5 is ${md5}`)
  // 若服务端存在此文件，则实现秒传
  const serverMD5 = await axios.post(`/query/file/info`, {
    fileName: file.name,
    fileSize: file.size,
    md5
  })
  if (serverMD5 === md5) {
    done = true
    processor.done()
  }
})

// 断点续传，当已上传3个碎片时
const fileInfo = processor.getFileInfo()
processor.start(fileInfo.uploadedChunks)
// 暂停
processor.pause()
// 重启
processor.play()

 ```

 ### API

1. 属性

 | 名称 | 说明 | 类型  | 参数 |
 | :---  | :----  | :---- | :---- |
 | chunkSize | 碎片大小 | Number | 无 |
 | uploadedChunkNum | 已上传碎片数 | Number | 无 |
 | [chunkMD5](#chunkMD5) | 碎片MD5 | Boolean | 默认为 `false` |
 | retryCount | 重试次数 | Number | 默认值为3次 |
 | httpRequest | 自定义请求方法 | Function | params: <a name="HttpRequestParams">HttpRequestParams</a> |
 | onProgress | 上传进度回调 | Function | progress?: Number 进度（百分比数值） |
 | onFinished | 文件分片完成回调 | Function | params: { fileInfo: <a name="FileInfo"> FileInfo </a> } |
 | onFileMD5Progress | 文件MD5进度回调 | Function | progress?: Number 进度（百分比数值）


2. 方法

| 名称 | 说明 | 参数  | 返回值 |
| :-- | :-- | :-- | :-- |
| getFileInfo | 获取文件信息 | 无 | <a name="FileInfo">FileInfo</a>
| getFileRealMD5 | 异步获取文件精准MD5 | 无 | Promise.then() / Promise.catch() |
| getChunk | 获取当前文件碎片 | 无 | Blob |
| getChunkMD5 | 获取当前碎片MD5 | 无 | Promise.then() / Promise.catch() |
| start | 文件分片开始 | num: 文件碎片索引，代表从第几片开始切片 | 无 |
| pause | 文件分片暂停 | 无 | 无 |
| play  | 文件分片重启 | 无 | 无 |
| done  | 文件分片完成 | 无 | 无 |
| next  | 文件分片下一次操作指令方法 | 无 | 无 |

3. 类型

| 接口 | 属性 |
| :-- | :-- |
| [FileInfo](#FileInfo) | id: Number （当前文件唯一标识） <br> name: String（文件名） <br>size: Number（文件size） <br> totalChunks: Number（文件碎片总数）<br> md5: String（文件md5）<br> uploadedChunks: Number（已上传碎片数） } |
| [HttpRequestParams](#HttpRequestParams) | chunk: Blob（文件碎片）<br> chunkNum: Number（碎片索引）<br> chunkMD5?: String （碎片MD5，<a name="chunkMD5">chunkMD5</a> 为 `true` 时返回） <br> <i>方法必须返回一个 `promise` 的结果</i> 

### 说明
---

这个工具库主要是对文件进行分片操作，不参与文件碎片的上传过程，这样可以让用户灵活的进行二次开发，工具库会提供一系列的回调函数来反馈文件分片过程中的进度和状态

### 注意事项
---

* 进度条是通过碎片索引/总碎片数得到的，所以需要细粒度的进度参数可以通过设置更小的分片阈值实现
* 文件 <a name="#FileInfo">md5</a> 默认为name、size、lastModified连接的字符串，如果需要准确的md5，可以使用getFileRealMD5方法来异步获取，并提供md5过程的进度回调函数
* 分片阈值默认为50MB

