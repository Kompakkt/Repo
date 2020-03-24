import {
  Component,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Input,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  isEntity,
  IEntity,
  IMetaDataDigitalEntity,
  IMetaDataInstitution,
  IMetaDataPerson,
  IMetaDataPhysicalEntity,
} from '@kompakkt/shared';
import { BackendService } from '../../services/backend.service';
import { AccountService } from '../../services/account.service';
import { DetailPageHelperService } from '../../services/detail-page-helper.service';
import { SelectHistoryService } from '../../services/select-history.service';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss'],
})
export class EntityDetailComponent
  implements OnChanges, OnInit, OnDestroy, AfterViewInit {
  public entity: IEntity | undefined;
  public object: IMetaDataDigitalEntity | undefined;
  public objectID = '';
  public objectReady = false;
  public downloadJsonHref: any;
  @Output()
  public updateViewerUrl = new EventEmitter<string>();
  @Output()
  public selectEntity = new EventEmitter<IEntity | undefined>();
  @Input()
  public parentElement: IEntity | undefined;

  public isAuthenticated = false;
  public isEntity = isEntity;

  public roleStrings = {
    RIGHTS_OWNER: 'Rights Owner',
    CREATOR: 'Creator',
    EDITOR: 'Editor',
    DATA_CREATOR: 'Data Creator',
    CONTACT_PERSON: 'Contact Person',
  };

  public Licenses = {
    BY: {
      src: 'assets/licence/BY.png',
      description: 'CC Attribution',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    'BY-SA': {
      src: 'assets/licence/BY-SA.png',
      description: 'CC Attribution-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    'BY-ND': {
      src: 'assets/licence/BY-ND.png',
      description: 'CC Attribution-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    BYNC: {
      src: 'assets/licence/BYNC.png',
      description: 'CC Attribution-NonCommercial',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    BYNCSA: {
      src: 'assets/licence/BYNCSA.png',
      description: 'CC Attribution-NonCommercial-ShareAlike',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    BYNCND: {
      src: 'assets/licence/BYNCND.png',
      description: 'CC Attribution-NonCommercial-NoDerivatives',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
  };

  private routerSubscription: Subscription;

  constructor(
    private account: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private backend: BackendService,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private detailPageHelper: DetailPageHelperService,
    private selectHistory: SelectHistoryService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.router.onSameUrlNavigation = 'reload';
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.fetchEntity();
      }
    });

    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );
  }

  get annotationCount() {
    if (!this.entity) return 0;
    return Object.keys(this.entity.annotations).length;
  }

  public embed = () => {
    const iframe = document.querySelector('iframe') as
      | HTMLIFrameElement
      | undefined;
    if (!iframe) return;
    this.detailPageHelper.copyEmbed(iframe.outerHTML);
  };

  public generateDownloadJsonUri() {
    const object = JSON.stringify(this.object, undefined, ' ');
    this.downloadJsonHref = this.sanitizer.bypassSecurityTrustUrl(
      `data:text/json;charset=UTF-8,${encodeURIComponent(object)}`,
    );
  }

  public getCreationDate = () =>
    this.entity ? this.detailPageHelper.getCreationDate(this.entity) : '';

  public getNumQualities = () =>
    this.entity ? this.detailPageHelper.getNumQualities(this.entity) : 1;

  public getQualitiesAndSizes = () =>
    this.entity ? this.detailPageHelper.getQualitiesAndSizes(this.entity) : '';

  public getEntityPersonByRole = (
    entity: IMetaDataDigitalEntity | IMetaDataPhysicalEntity,
    role: string,
  ) =>
    entity.persons.filter(person => this.getPersonRole(person).includes(role));

  public copyID = () => this.detailPageHelper.copyID(this.objectID);

  public getPersonRole = (person: IMetaDataPerson) =>
    this.object ? person.roles[this.object._id.toString()] : [];

  public getContactRef(person: IMetaDataPerson) {
    if (!this.object) return undefined;
    const related = person.contact_references[this.object._id.toString()];
    const latest = Object.values(person.contact_references)
      .filter(ref => ref.mail !== '')
      .sort((a, b) => a.creation_date - b.creation_date);
    return related && related.mail !== ''
      ? related
      : latest.length > 0
      ? latest[0]
      : undefined;
  }

  public getAddress(inst: IMetaDataInstitution) {
    if (!this.object) return undefined;
    return inst.addresses[this.object._id.toString()]
      ? inst.addresses[this.object._id.toString()]
      : Object.keys(inst.addresses).length > 0
      ? inst.addresses[Object.keys(inst.addresses)[0]]
      : undefined;
  }

  public getEntityInstitutionByRole = (
    entity: IMetaDataDigitalEntity | IMetaDataPhysicalEntity,
    role: string,
  ) =>
    entity.institutions.filter(
      inst =>
        inst.roles[entity._id.toString()] &&
        inst.roles[entity._id.toString()].includes(role),
    );

  public fetchEntity = () => {
    this.selectHistory.resetEntityUses();
    this.objectID = this.parentElement
      ? this.parentElement._id.toString()
      : this.route.snapshot.paramMap.get('id') || '';
    this.objectReady = false;
    console.log('Fetching entity');
    this.backend
      .getEntity(this.objectID)
      .then(resultEntity => {
        if (!resultEntity.relatedDigitalEntity) {
          throw new Error('Invalid object metadata');
        }
        this.entity = resultEntity;

        this.selectEntity.emit(this.entity);

        // Add to selection history
        this.selectHistory.select(this.entity);

        console.log('Got entity');

        return this.backend.getEntityMetadata(
          resultEntity.relatedDigitalEntity._id,
        );
      })
      .then(result => {
        console.log('Updating viewer url');
        this.object = result;
        this.objectReady = true;

        this.titleService.setTitle(`Kompakkt – ${this.object.title}`);
        this.metaService.updateTag({
          name: 'description',
          content: this.object.description,
        });

        this.updateViewerUrl.emit(
          `${environment.kompakkt_url}?entity=${this.objectID}&mode=open`,
        );
      })
      .catch(e => {
        console.log('Failed fetching entity, fallback viewer');
        this.updateViewerUrl.emit(
          `${environment.kompakkt_url}?entity=${this.objectID}&mode=upload`,
        );
        this.object = undefined;
        this.objectReady = true;
        console.error(e);
      });
  };

  ngOnInit() {
    this.fetchEntity();
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

    setTimeout(() => clearInterval(interval), 500);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.parentElement) return;
    if (!changes.parentElement.currentValue) return;
    if (!isEntity(changes.parentElement.currentValue)) return;
    if (
      changes.parentElement.previousValue &&
      changes.parentElement.currentValue._id ===
        changes.parentElement.previousValue._id
    )
      return;
    this.fetchEntity();
  }
}
