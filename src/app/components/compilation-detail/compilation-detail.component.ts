import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/index';

import { environment } from '../../../environments/environment';
import { ICompilation } from '../../interfaces';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { SelectHistoryService } from '../../services/select-history.service';
import { DetailPageHelperService } from '../../services/detail-page-helper.service';

@Component({
  selector: 'app-compilation-detail',
  templateUrl: './compilation-detail.component.html',
  styleUrls: ['./compilation-detail.component.scss'],
})
export class CompilationDetailComponent
  implements OnInit, OnDestroy, AfterViewInit {
  private routerSubscription: Subscription;
  public _id = '';
  public comp: ICompilation | undefined;
  public objectReady = false;
  public viewerUrl = '';
  public downloadJsonHref = '' as SafeUrl;

  constructor(
    private mongo: MongoHandlerService,
    private route: ActivatedRoute,
    private router: Router,
    private selectHistory: SelectHistoryService,
    private helper: DetailPageHelperService,
    private sanitizer: DomSanitizer,
  ) {
    this.router.onSameUrlNavigation = 'reload';
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.fetchCompilation();
      }
    });
  }

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

  private fetchCompilation() {
    this._id = this.route.snapshot.paramMap.get('id') || '';
    this.objectReady = false;
    this.mongo
      .getCompilation(this._id)
      .then(result => {
        console.log(result);
        if (result.status === 'ok') {
          this.comp = result;
          this.objectReady = true;

          this.selectHistory.select(this.comp);

          this.viewerUrl = `${environment.kompakkt_url}?compilation=${this._id}&mode=open`;
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
}
