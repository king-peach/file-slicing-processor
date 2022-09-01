interface File {
  name: string;
  size: number;
  lastModified: number;
  lastModifiedDate: string;
  type: string;
  webkitRelativePath?: string;
}

interface FileInfo {
  name: string;
  size: number;
  totalChunks: number;
  md5: string;
  uploadedChunks: number;
}

interface InstanceParams {
  chunkSize: number;
  fileMd5: boolean,
  chunkMd5: boolean;
  onProgress: (process?: number) => void;
  onFinished: (fileInfo?: FileInfo) => void;
  onError: (err?: Error) => void;
}

declare class FileSlicingProcessor {
    private chunkSize;
    private fileInfo;
    private uploadedChunkNum;
    private onError;
    private onFinished;
    private onProgress;
    private onFileMD5Progress;
    private file;
    constructor(file: File, params?: Partial<InstanceParams>);
    getFileRealMD5(): Promise<unknown>;
    getChunk(): any;
    getChunkMD5(): Promise<unknown>;
    next(): void;
    private handleFileSlice;
    reStart(): void;
}

export { FileSlicingProcessor as default };
