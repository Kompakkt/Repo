import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer, Meta, SafeUrl, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/index';

import { environment } from '../../../environments/environment';
import { ICompilation } from '../../interfaces';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { SelectHistoryService } from '../../services/select-history.service';
import { DetailPageHelperService } from '../../services/detail-page-helper.service';
import { DialogHelperService } from '../../services/dialog-helper.service';

import { isCompilation, isEntity } from '../../typeguards';

@Component({
  selector: 'app-compilation-detail',
  templateUrl: './compilation-detail.component.html',
  styleUrls: ['./compilation-detail.component.scss'],
})
export class CompilationDetailComponent
  implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  private routerSubscription: Subscription;
  public _id = '';
  public comp: ICompilation | undefined;
  public objectReady = false;
  @Output()
  public selectCompilation = new EventEmitter<ICompilation | undefined>();
  @Output()
  public updateViewerUrl = new EventEmitter<string>();
  public downloadJsonHref = '' as SafeUrl;
  @Input()
  public parentElement: ICompilation | undefined;

  public isCompilation = isCompilation;

  constructor(
    private mongo: MongoHandlerService,
    private route: ActivatedRoute,
    private router: Router,
    private selectHistory: SelectHistoryService,
    private helper: DetailPageHelperService,
    private sanitizer: DomSanitizer,
    private dialog: DialogHelperService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.router.onSameUrlNavigation = 'reload';
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.fetchCompilation();
      }
    });
  }

  public embed = () => {
    const iframe = document.querySelector('iframe') as
      | HTMLIFrameElement
      | undefined;
    if (!iframe) return;
    this.helper.copyEmbed(iframe.outerHTML);
  };

  public getCreationDate = () =>
    this.comp ? this.helper.getCreationDate(this.comp) : '';

  public copyID = () => this.helper.copyID(this._id);

  public generateDownloadJsonUri = () => {
    this.downloadJsonHref = this.sanitizer.bypassSecurityTrustUrl(
      `data:text/json;charset=UTF-8,${encodeURIComponent(
        JSON.stringify(this.comp),
      )}`,
    );
  };

  private passwordConfirmation() {
    this.dialog
      .openPasswordProtectedDialog()
      .afterClosed()
      .toPromise()
      .then(password => {
        if (!password) {
          this.router.navigateByUrl('/explore');
        } else {
          this.fetchCompilation(password);
        }
      });
  }

  private fetchCompilation(password?: string) {
    this._id = this.route.snapshot.paramMap.get('id') || '';
    this.objectReady = false;
    this.mongo
      .getCompilation(this._id, password)
      .then(result => {
        const isPWProtected =
          result.message && result.message.toLowerCase().includes('password');
        if (isPWProtected) {
          if (!this.comp) return this.passwordConfirmation();
          return;
        }
        console.log(result);

        if (result.status === 'ok' && isCompilation(result)) {
          this.comp = result;
          this.objectReady = true;

          this.titleService.setTitle(`Kompakkt – Collection ${this.comp.name}`);
          this.metaService.updateTag({
            name: 'description',
            content: this.comp.description,
          });

          this.selectCompilation.emit(this.comp);

          this.selectHistory.select(this.comp);
          this.updateViewerUrl.emit(
            `${environment.kompakkt_url}?compilation=${this._id}&mode=open`,
          );
        } else {
          throw new Error('Failed getting compilation');
        }
      })
      .catch(err => {
        console.error(err);
        this.objectReady = false;
        this.comp = undefined;
      });
  }

  // Annotation Access
  get isAnnotatePrivate() {
    if (!this.comp) return false;
    return !this.comp.whitelist.enabled;
  }

  get isAnnotatePublic() {
    if (!this.comp) return false;
    return (
      this.comp.whitelist.enabled &&
      this.comp.whitelist.persons.length + this.comp.whitelist.groups.length ===
        0
    );
  }

  get isAnnotateWhitelist() {
    if (!this.comp) return false;
    return (
      this.comp.whitelist.enabled &&
      this.comp.whitelist.persons.length + this.comp.whitelist.groups.length > 0
    );
  }

  // Password protection
  get isPasswordProtected() {
    if (!this.comp) return false;
    return this.comp.password && this.comp.password !== '';
  }

  // Count media types
  get imageCount() {
    if (!this.comp) return 0;
    return this.comp.entities.filter(
      e => isEntity(e) && e.mediaType === 'image',
    ).length;
  }

  get modelCount() {
    if (!this.comp) return 0;
    return this.comp.entities.filter(
      e => isEntity(e) && e.mediaType === 'model',
    ).length;
  }

  get videoCount() {
    if (!this.comp) return 0;
    return this.comp.entities.filter(
      e => isEntity(e) && e.mediaType === 'video',
    ).length;
  }

  get audioCount() {
    if (!this.comp) return 0;
    return this.comp.entities.filter(
      e => isEntity(e) && e.mediaType === 'audio',
    ).length;
  }

  ngOnInit() {
    this.fetchCompilation();
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    // Workaround for https://github.com/angular/components/issues/11478
    const interval = setInterval(
      () =>
        document
          .querySelectorAll('mat-tooltip-component')
          .forEach(item => item.remove()),
      50,
    );

    setTimeout(() => clearInterval(interval), 2500);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.parentElement) return;
    if (!changes.parentElement.currentValue) return;
    if (!isCompilation(changes.parentElement.currentValue)) return;
    if (
      changes.parentElement.previousValue &&
      changes.parentElement.currentValue._id ===
        changes.parentElement.previousValue._id
    )
      return;
    this.fetchCompilation();
  }
}
