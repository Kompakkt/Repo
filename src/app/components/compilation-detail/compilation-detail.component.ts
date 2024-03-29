import { Component, AfterViewInit, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { isCompilation, isEntity, ICompilation, IEntity } from 'src/common';
import { DetailPageHelperService } from 'src/app/services';
import { TranslateService } from '../../services/translate.service';

@Component({
  selector: 'app-compilation-detail',
  templateUrl: './compilation-detail.component.html',
  styleUrls: ['./compilation-detail.component.scss'],
})
export class CompilationDetailComponent implements AfterViewInit {
  public downloadJsonHref = '' as SafeUrl;
  @Input()
  public compilation: ICompilation | undefined;

  public isEntity = isEntity;
  public isCompilation = isCompilation;

  constructor(private helper: DetailPageHelperService, private sanitizer: DomSanitizer) {}

  get _id() {
    return this.compilation?._id.toString();
  }

  get creationDate() {
    return this.compilation ? this.helper.getCreationDate(this.compilation) : '';
  }

  get downloadFileName() {
    return `obj-${this._id}.json`;
  }

  public embed() {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | undefined;
    if (!iframe) return;
    this.helper.copyEmbed(iframe.outerHTML);
  }

  public copyID() {
    this.helper.copyID(this._id ?? '');
  }

  public generateDownloadJsonUri() {
    this.downloadJsonHref = this.sanitizer.bypassSecurityTrustUrl(
      `data:text/json;charset=UTF-8,${encodeURIComponent(JSON.stringify(this.compilation))}`,
    );
  }

  // Annotation Access
  get isAnnotatePrivate() {
    if (!this.compilation) return false;
    return !this.compilation.whitelist.enabled;
  }

  get isAnnotatePublic() {
    if (!this.compilation) return false;
    return (
      this.compilation.whitelist.enabled &&
      this.compilation.whitelist.persons.length + this.compilation.whitelist.groups.length === 0
    );
  }

  get isAnnotateWhitelist() {
    if (!this.compilation) return false;
    return (
      this.compilation.whitelist.enabled &&
      this.compilation.whitelist.persons.length + this.compilation.whitelist.groups.length > 0
    );
  }

  // Password protection
  get isPasswordProtected() {
    if (!this.compilation) return false;
    return this.compilation.password && this.compilation.password !== '';
  }

  // Count media types
  get imageCount() {
    if (!this.compilation) return 0;
    return Object.values(this.compilation.entities).filter(
      e => isEntity(e) && e.mediaType === 'image',
    ).length;
  }

  get modelCount() {
    if (!this.compilation) return 0;
    return Object.values(this.compilation.entities).filter(
      e => isEntity(e) && e.mediaType === 'model',
    ).length;
  }

  get videoCount() {
    if (!this.compilation) return 0;
    return Object.values(this.compilation.entities).filter(
      e => isEntity(e) && e.mediaType === 'video',
    ).length;
  }

  get audioCount() {
    if (!this.compilation) return 0;
    return Object.values(this.compilation.entities).filter(
      e => isEntity(e) && e.mediaType === 'audio',
    ).length;
  }

  // Compilation data
  get entityCount() {
    if (!this.compilation) return 0;
    return Object.keys(this.compilation.entities).length;
  }

  get annotationCount() {
    if (!this.compilation) return 0;
    return Object.keys(this.compilation.annotations).length;
  }

  get entities(): IEntity[] {
    if (!this.compilation) return [];
    return Object.values(this.compilation.entities).filter(e => isEntity(e)) as IEntity[];
  }

  ngAfterViewInit() {
    // Workaround for https://github.com/angular/components/issues/11478
    const interval = setInterval(
      () => document.querySelectorAll('mat-tooltip-component').forEach(item => item.remove()),
      50,
    );

    setTimeout(() => clearInterval(interval), 2500);
  }
}
