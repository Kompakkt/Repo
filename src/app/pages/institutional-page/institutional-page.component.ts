import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';
import { ActionbarComponent, GridElementComponent } from 'src/app/components';
import { MatButton } from '@angular/material/button';
import { MatMenu } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { AccountService } from 'src/app/services';
import { ActivatedRoute, RouterLink } from '@angular/router';


@Component({
    selector: 'app-institutional-page',
    templateUrl: './institutional-page.component.html',
    styleUrls: ['./institutional-page.component.scss'],
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
      MatTabsModule,
      RouterLink,
      
    ],
  })

export class InstitutionalPageComponent implements OnInit {
  public userData: any = {}; //Declare the userData property
  public bio: string = ''; 
  public mail: string = '';
  public phone: string = '';

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
    this.titleService.setTitle('Kompakkt – Institutional Page');
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt Institutional Page.',
      
    });
    //Initialize user bio, mail and phone number
    /*this.bio = this.userData?.bio || 'Empty bio';
    this.mail = this.userData?.mail || 'no email-address';
    this.phone = this.userData?.phone || 'no phone number';
    */
  }
}


