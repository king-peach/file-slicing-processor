export interface File {
  name: string;
  size: number;
  lastModified: number;
  lastModifiedDate: string;
  type: string;
  webkitRelativePath?: string;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  totalChunks: number;
  md5: string;
  uploadedChunks: number;
}

export interface InstanceParams {
  chunkSize: number;
  uploadedChunkNum: number,
  chunkMd5: boolean;
  retryCount: number;
  onProgress: (process?: number) => void;
  onFinished: (fileInfo?: FileInfo) => void;
  onError: (err?: Error) => void;
  onFileMD5Progress: (progress?: number) => void;
}

export interface HttpRequestParams {
  chunk: Blob;
  chunkNum: number;
  chunkMD5?: string;
}

export enum Status {
  READY = 'READY',
  MD5 = 'MD5',
  UPLAODING = 'UPLOADING',
  PAUSE = 'PAUSE',
  DONE = 'DONE'
}
