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
  fileMd5: boolean,
  chunkMd5: boolean;
  onProgress: (process?: number) => void;
  onFinished: (fileInfo?: FileInfo) => void;
  onError: (err?: Error) => void;
}
