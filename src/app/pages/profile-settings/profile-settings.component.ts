import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';
import { ActionbarComponent, GridElementComponent } from 'src/app/components';
import { MatButton } from '@angular/material/button';
import { MatMenu } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem } from '@angular/material/list';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { AsyncPipe } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { ICompilation, IEntity, IGroup, IUserData, isMetadataEntity } from 'src/common';
import { AccountService } from 'src/app/services';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-profile-settings',
    templateUrl: './profile-settings.component.html',
    styleUrls: ['./profile-settings.component.scss'],
    standalone: true,
    imports: [
      TranslatePipe_1, 
      ActionbarComponent, 
      GridElementComponent,
      MatPaginator,
      MatMenu,
      MatButton,
      MatIcon,
      AsyncPipe,
      MatToolbar,
      MatList,
      MatListItem,
      MatFormField,
      MatLabel,
    ],
  })


  export class ProfileSettingsComponent implements OnInit {
    public userData: any; //Declare the userData property
  constructor(
      //private translatePipe: TranslatePipe,
      private titleService: Title,
      private metaService: Meta,
      private accountService: AccountService,
      private route: ActivatedRoute,
  ) {
    //Fetch user data from route or use accountService
    this.userData = this.route.snapshot.data.userData;
  
    this.accountService.user$.subscribe(newData => {
      this.userData = newData; 
    })
  }
  
  ngOnInit() {
      this.titleService.setTitle('Kompakkt – Proile Settings');
      this.metaService.updateTag({
        name: 'description',
        content: 'Kompakkt - Settings.',
      });
    }
  }
  
  
  