import { Component, AfterViewInit, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { isCompilation, isEntity, ICompilation, IEntity } from 'src/common';
import {
  AllowAnnotatingService,
  DetailPageHelperService,
  DialogHelperService,
} from 'src/app/services';

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

  constructor(
    private helper: DetailPageHelperService,
    private sanitizer: DomSanitizer,
    public dialogHelper: DialogHelperService,
    private allowAnnotatingHelper: AllowAnnotatingService,
  ) {}

  get _id() {
    return this.compilation?._id.toString();
  }

  get creationDate() {
    return this.compilation ? this.helper.getCreationDate(this.compilation) : '';
  }

  get downloadFileName() {
    return `obj-${this._id}.json`;
  }

  get isUserOwner() {
    if (!this.compilation) return false;
    return this.allowAnnotatingHelper.isUserOwner(this.compilation);
  }

  get allowAnnotating() {
    if (!this.compilation) return false;
    return (
      this.isUserOwner ||
      this.allowAnnotatingHelper.isElementPublic(this.compilation) ||
      this.allowAnnotatingHelper.isUserWhitelisted(this.compilation)
    );
  }

  public embed() {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement | undefined;
    if (!iframe) return;
    this.helper.copyEmbed(iframe.outerHTML);
  }

  public copyID() {
    this.helper.copyID(this._id ?? '');
  }

  public downloadMetadata() {
    const compilation = this.compilation;
    if (!compilation) return;
    const blob = new Blob([JSON.stringify(compilation)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `${compilation.name}.json`;

    document.body.appendChild(link);
    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    document.body.removeChild(link);
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
