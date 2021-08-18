import { Component } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { zip } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Meta, Title } from '@angular/platform-browser';

import { SelectHistoryService } from '../../services/select-history.service';
import { DialogHelperService } from '../../services/dialog-helper.service';
import { BackendService } from '../../services/backend.service';
import { environment } from '../../../environments/environment';

import {
  isDigitalEntity,
  isCompilation,
  isEntity,
  ICompilation,
  IEntity,
  ObjectId,
} from 'src/common';

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.component.html',
  styleUrls: ['./detail-page.component.scss'],
})
export class DetailPageComponent {
  private baseURL = `${environment.viewer_url}`;

  private type = '';
  public viewerUrl = '';
  public element: IEntity | ICompilation | undefined;

  public isEntity = isEntity;
  public isCompilation = isCompilation;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private backend: BackendService,
    private selectHistory: SelectHistoryService,
    private titleService: Title,
    private metaService: Meta,
    private dialog: DialogHelperService,
  ) {
    this.router.onSameUrlNavigation = 'reload';

    this.route.data.subscribe(data => (this.type = data.type));

    zip(
      this.router.events.pipe(filter(event => event instanceof NavigationEnd)),
      this.route.params,
    ).subscribe(async arr => {
      // const event = arr[0]; // Unused? Only to check if NavigationEnd
      const params = arr[1];
      const { id } = params;
      if (!id || !ObjectId.isValid(id)) {
        console.error('Invalid id given to DetailPageComponent', this);
        return;
      }

      // TODO: should viewer be in upload mode if loading fails?

      switch (this.type) {
        case 'entity':
          await this.fetchEntity(id);
          this.viewerUrl = `${this.baseURL}?entity=${id}&mode=open`;
          break;
        case 'compilation':
          await this.fetchCompilation(id);
          this.viewerUrl = `${this.baseURL}?compilation=${id}&mode=open`;
          break;
        default:
          console.error('No type found in DetailPageComponent', this);
      }
      this.updatePageMetadata();
    });
  }

  private async fetchEntity(id: string | ObjectId) {
    const entity = await this.backend.getEntity(id.toString());
    if (!entity || !isEntity(entity)) return console.error('Failed getting entity');

    this.element = entity;
    console.log('Fetched entity', this.element);
  }

  private async fetchCompilation(id: string | ObjectId, password?: string) {
    id = id.toString();
    const compilation = await this.backend.getCompilation(id, password);
    if (!compilation || !isCompilation(compilation)) {
      return this.passwordConfirmation(id);
      // return console.error('Failed getting compilation');
    }

    this.element = compilation;
  }

  private passwordConfirmation(id: string) {
    this.dialog
      .openPasswordProtectedDialog()
      .afterClosed()
      .toPromise()
      .then(password => {
        if (!password) {
          this.router.navigateByUrl('/explore');
        } else {
          this.fetchCompilation(id, password);
        }
      });
  }

  private updatePageMetadata() {
    if (!this.element) return;
    this.titleService.setTitle(`Kompakkt – ${this.element.name}`);

    const description =
      isEntity(this.element) && isDigitalEntity(this.element.relatedDigitalEntity)
        ? this.element.relatedDigitalEntity.description
        : isCompilation(this.element)
        ? this.element.description
        : '';

    this.metaService.updateTag({
      name: 'description',
      content: description,
    });

    this.selectHistory.select(this.element);
  }
}
