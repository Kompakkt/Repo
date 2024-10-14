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
    ],
  })

export class InstitutionalPageComponent implements OnInit {
constructor(
    //private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
) {}

ngOnInit() {
    this.titleService.setTitle('Kompakkt – Institutional Page');
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt Institutional Page.',
    });
  }
}


