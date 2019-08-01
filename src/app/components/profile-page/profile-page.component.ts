import { Component, OnInit } from '@angular/core';

import { ILDAPData } from '../../interfaces';
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

  ngOnInit() {
  }

}
