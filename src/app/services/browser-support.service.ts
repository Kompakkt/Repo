import { Service } from '@angular/core';

@Service()
export class BrowserSupportService {
  /**
   * DropEvents in modern browsers use DataTransfer
   * to list items and make them available as WebKitEntries.
   * This is experimental, so check for support
   */
  #dragDropSupport =
    (window &&
      window['DataTransfer'] &&
      window['DataTransferItem'] &&
      window['DataTransferItemList']) !== undefined;

  /**
   * HTMLInputElements can accept directories as WebKitDirectory
   * when the property webkitdirectory is available and enabled.
   * This is experimental, so check for support
   */
  #webkitDirSupport = (document.createElement('input') as any)['webkitdirectory'] !== undefined;

  constructor() {
    console.log(
      'BrowserSupport:',
      'DragEvent DataTransfer:',
      this.#dragDropSupport,
      'WebkitDirectory:',
      this.#webkitDirSupport,
    );
  }

  get isDragDropSupported() {
    return this.#dragDropSupport;
  }

  get isWebkitDirSupported() {
    return this.#webkitDirSupport;
  }
}
