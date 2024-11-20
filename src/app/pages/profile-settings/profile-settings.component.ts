import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';
import { ActionbarComponent, GridElementComponent } from 'src/app/components';
import { MatButton } from '@angular/material/button';
import { MatMenu } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem } from '@angular/material/list';
import { AsyncPipe } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { AccountService } from 'src/app/services';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
      CommonModule,
      RouterModule,
      RouterOutlet,
    ],
  })

  export class ProfileSettingsComponent implements OnInit {

  constructor(
      //private translatePipe: TranslatePipe,
      private titleService: Title,
      private metaService: Meta,
  ) {}
  
    ngOnInit() {
      this.titleService.setTitle('Kompakkt – Profile Settings');
      this.metaService.updateTag({
        name: 'description',
        content: 'Kompakkt - Settings.',
      });
    }

  }




  
  
  