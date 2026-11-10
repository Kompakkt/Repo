import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, signal, inject, model, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTab, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormFieldGroups, FormFieldGroupsValues, isFormFieldGroupValue } from 'src/app/metadata';
import { IDigitalEntityResolved } from '@kompakkt/common';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { AgentsComponent } from '../agents/agents.component';
import { GeneralComponent } from '../general/general.component';
import { BiblioRefComponent } from '../optional/biblio-ref/biblio-ref.component';
import { CreationComponent } from '../optional/creation/creation.component';
import { ExternalIdsComponent } from '../optional/external-ids/external-ids.component';
import { LinksComponent } from '../optional/links/links.component';
import { MetadataFilesComponent } from '../optional/metadata-files/metadata-files.component';
import { PhysObjComponent } from '../optional/phys-obj/phys-obj.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { LicenceComponent } from '../licence/licence.component';
import { OptionalCount } from './optional-count.component';
import { ValidationError } from '@angular/forms/signals';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatRadioModule,
    MatSidenavModule,
    MatListModule,
    MatTabsModule,
    NgxFluentPipe,
    AgentsComponent,
    CreationComponent,
    LinksComponent,
    PhysObjComponent,
    GeneralComponent,
    ExternalIdsComponent,
    BiblioRefComponent,
    MetadataFilesComponent,
    MatExpansionModule,
    LicenceComponent,
    OptionalCount,
  ],
})
export class EntityComponent {
  dialog = inject(MatDialog);
  entity = model.required<IDigitalEntityResolved>();
  selectedTabIndex = signal(0);
  separatorKeysCodes: number[] = [ENTER, COMMA];
  tabLabels = FormFieldGroups;

  constructor() {
    (window as any)['printEntity'] = () => console.log(this.entity());
  }

  tabGroup = viewChild.required<MatTabGroup>('tabGroup');

  selectTab(tab: MatTab) {
    const tabIndex = this.tabGroup()._tabs.reduce((acc, curr, index) => {
      if (curr === tab) acc = index;
      return acc;
    }, 0);
    this.selectedTabIndex.set(tabIndex);
  }

  selectTabByLabel(label: FormFieldGroupsValues) {
    const tabIndex = this.tabGroup()._tabs.reduce((acc, curr, index) => {
      if (curr.textLabel === label) acc = index;
      return acc;
    }, 0);
    this.selectedTabIndex.set(tabIndex);
  }

  jumpToError(error: ValidationError) {
    const kind = error.kind;
    if (!kind) return console.warn('Cannot jump to tab with errors without error kind', error);
    if (!isFormFieldGroupValue(kind))
      return console.warn(
        'Cannot jump to tab with errors without error kind being a valid tab label',
        error,
      );
    return this.selectTabByLabel(kind);
  }

  removeValueFromProperty({ property, index }: { property: string; index: number }) {
    this.entity.update(entity => {
      const clone = structuredClone(entity);
      if (Array.isArray(clone[property])) {
        const arr = [...clone[property]];
        arr.splice(index, 1);
        clone[property] = arr;
      }
      return clone;
    });
  }
}
