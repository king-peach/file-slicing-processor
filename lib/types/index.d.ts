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
  fileMd5: boolean,
  chunkMd5: boolean;
  onProgress: (process?: number) => void;
  onFinished: (fileInfo?: FileInfo) => void;
  onError: (err?: Error) => void;
}

declare class FileSlicingProcessor {
    #private;
    constructor(file: File, options?: Partial<InstanceParams>);
    getFileInfo(): Partial<FileInfo>;
    getFileRealMD5(): Promise<unknown>;
    getChunk(): any;
    getChunkMD5(): Promise<unknown>;
    next(): void;
    private handleFileSlice;
    reStart(num?: number): void;
}

export { FileSlicingProcessor as default };
