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
    private fileMd5;
    private chunkMd5;
    private fileInfo;
    private onError;
    private onFinished;
    private onProgress;
    private file;
    constructor(file: File, params?: Partial<InstanceParams>);
    getChunk(): any;
    next(): void;
    private handleFileSlice;
    reStart(): void;
}

export { FileSlicingProcessor as default };
