interface File {
  name: string;
  size: number;
  lastModified: number;
  lastModifiedDate: string;
  type: string;
  webkitRelativePath?: string;
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  totalChunks: number;
  md5: string;
  uploadedChunks: number;
}

interface InstanceParams {
  chunkSize: number;
  uploadedChunkNum: number,
  chunkMd5: boolean;
  retryCount: number;
  onProgress: (process?: number) => void;
  onFinished: (fileInfo?: FileInfo) => void;
  onError: (err?: Error) => void;
  onFileMD5Progress: (progress?: number) => void;
}

declare class FileSlicingProcessor {
    #private;
    constructor(file: File, options?: Partial<InstanceParams>);
    getFileInfo(): Partial<FileInfo>;
    getFileRealMD5(): Promise<unknown>;
    getChunk(): any;
    getChunkMD5(): Promise<string>;
    start(num?: number): Promise<Error>;
    pause(): void;
    play(): void;
    done(): void;
    next(): void;
}

export { FileSlicingProcessor as default };
