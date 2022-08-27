(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.FileSlicingProcessor = factory());
})(this, (function () { 'use strict';

    var isType = function (type) { return function (value) { return Object.prototype.toString.call(value) === "[object ".concat(type, "]"); }; };
    var isObject = isType('Object');
    var isFile = isType('File');
    var FileSlicingProcessor = /** @class */ (function () {
        function FileSlicingProcessor(file, params) {
            var _this = this;
            /* 文件分片阈值 */
            this.chunkSize = 20 * 1024 * 1024;
            /* 是否需要进行文件md5 */
            this.fileMd5 = false;
            /* 是否需要进行文件碎片md5 */
            this.chunkMd5 = false;
            /* 文件信息 */
            this.fileInfo = {};
            this.onError = null;
            this.onFinished = null;
            this.onProgress = null;
            this.file = null;
            if (isObject(params)) {
                Object.keys(params).forEach(function (key) {
                    if (params[key])
                        _this[key] = params[key];
                });
            }
            if (!isFile(file)) {
                var error = new Error('param error: the file is not file type');
                typeof this.onError === 'function' && this.onError(error);
                return error;
            }
            this.fileInfo = {
                name: file.name,
                size: file.size,
                totalChunks: Math.ceil(file.size / this.chunkSize),
                md5: "".concat(file.name, "-").concat(file.size, "-").concat(file.lastModified),
                uploadedChunks: 0
            };
            this.file = file;
        }
        FileSlicingProcessor.prototype.getChunk = function () {
            var chunk = this.handleFileSlice(this.fileInfo.uploadedChunks, this.fileInfo.uploadedChunks + 1);
            return chunk;
        };
        FileSlicingProcessor.prototype.next = function () {
            this.fileInfo.uploadedChunks++;
            if (this.fileInfo.uploadedChunks === this.fileInfo.totalChunks)
                this.onFinished(this.fileInfo);
            var progress = Math.ceil(this.fileInfo.uploadedChunks / this.fileInfo.totalChunks * Math.pow(10, 4)) / Math.pow(10, 2);
            this.onProgress(progress);
        };
        FileSlicingProcessor.prototype.handleFileSlice = function (start, end) {
            if (end <= this.fileInfo.totalChunks) {
                return this.file.slice(start * this.chunkSize, end * this.chunkSize);
            }
            return null;
        };
        FileSlicingProcessor.prototype.reStart = function () {
            this.fileInfo.uploadedChunks = 0;
        };
        return FileSlicingProcessor;
    }());

    return FileSlicingProcessor;

}));
