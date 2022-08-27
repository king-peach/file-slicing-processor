file-slicing-processor
==

### 特点
---
主要用来处理web端文件分片上传过程中文件分片的过程，提供文件切片，进度条，输出文件碎片等功能（支持TS）

### 安装
---

```sh
npm install file-slicing-processor
```

### 快速上手
---

```javascript
  import FileSlicingProcessor from 'file-slicing-processor'

  const file = document.querySelector('#file').files[0];
  let done = false;
  const processor = new FileSlicingProcessor(file, {
    onProgress: progress => {
      console.log(`uplaod progress is `, progress);
    },
    onFinished: fileInfo => {
      console.log(`the file upload done, the file info is `, fileInfo)
      done = true
    },
    onError: err => {
      console.error(`file upload error, err: `, err)
    }
  });

  async function upload () {
    const chunk = processor.getChunk()
    const formData = new FormData()
    formData.append('chunk', chunk)
    formData.append('fileName', file.name)
    formData.append('chunkNum', processor.file.uploadedChunk)
    const res = await axios.post(`/file/upload`, { formData });
    if (res) {
      progressor.next()
      if (!done) upload()
    }
  }
```

### 说明
---

这个工具库主要是对文件进行分片操作，不参与碎片的上传过程，这样可以让用户灵活的进行二次开发，工具库只会向外暴露每一次的碎片数据和文件信息

### 注意事项
---

* 文件分片操作必须通过调用next方法进行下一步，才能获取到下一个碎片以及进度递增；
* 进度条是通过碎片索引/总碎片数得到的，所以需要细粒度的进度参数可以通过设置更小的分片阈值实现

