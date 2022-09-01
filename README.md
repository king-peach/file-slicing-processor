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
    uploadedChunkNum: 0,
    onProgress (progress) {
      console.log(`uplaod progress is ${progress}`)
    },
    onFinished (fileInfo) {
      console.log(`the file upload done, the file info is `, fileInfo)
      done = true
    },
    onError (err) {
      console.error(`file upload error, err: `, err)
    }
  });

  async function upload () {
    const chunk = processor.getChunk()
    const formData = new FormData()

    formData.append('chunk', chunk)
    formData.append('fileName', file.name)
    formData.append('', this.fileInfo.totalChunks)
    formData.append('chunkNum', processor.file.uploadedChunk)

    const res = await axios.post(`/file/upload`, { formData })
    if (res) {
      progressor.next()
      if (!done) upload()
    }
  }
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
  }
})

processor.getFileRealMD5().then(md5 => {
  console.log(`file real md5 is ${md5}`)
  // 若服务端存在此文件，则实现秒传
  const serverMD5 = axios.post(`/query/file/info`, {
    fileName: file.name,
    fileSize: file.size,
    md5
  })
  if (serverMD5 === md5) {
    done = true
  }
})

// 断点续传，当已上传3个碎片时
processor.reStart(3)
processor.next()
……

 ```

### 说明
---

这个工具库主要是对文件进行分片操作，不参与文件碎片的上传过程，这样可以让用户灵活的进行二次开发，工具库会提供一系列的回调函数来反馈文件分片过程中的进度和状态

### 注意事项
---

* 文件分片操作必须通过调用next方法进行下一步，才能获取到下一个碎片以及进度递增；
* 进度条是通过碎片索引/总碎片数得到的，所以需要细粒度的进度参数可以通过设置更小的分片阈值实现
* 文件md5默认为name、size、lastModified连接的字符串，如果需要准确的md5，可以使用getFileRealMD5方法来异步获取，并提供md5过程的进度回调函数
* 分片阈值默认为50MB

