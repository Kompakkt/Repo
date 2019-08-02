import { Component, OnInit } from '@angular/core';

import { ICompilation, IEntity, ILDAPData, IMetaDataDigitalEntity  } from '../../interfaces';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {

  public userData: ILDAPData | undefined;

  constructor(private account: AccountService) {
    this.account.userDataObservable.subscribe(newData => {
      this.userData = newData;
      console.log('Userdata received in ProfilePageComponent', this.userData);
    });
  }

  // Public: finished && online
  public getPublicEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(entity => entity.finished && entity.online)
      : []

  // Finished: finished && !online
  public getFinishedEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(entity => entity.finished && !entity.online)
      : []

  // Unfinished: !finished && !online
  public getUnfinishedEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(entity => !entity.finished && !entity.online)
      : []

  // DigitalEntities are top-level metadata, containing other metadata
  public getMetadataEntities = () =>
    this.userData && this.userData.data.digitalobject
      ? (this.userData.data.digitalentity as unknown as IMetaDataDigitalEntity[])
      : []

  // Compilations containing Entities
  public getCompilations = () =>
    this.userData && this.userData.data.compilation
      ? (this.userData.data.compilation as ICompilation[])
      : []

  ngOnInit() {
  }

}
