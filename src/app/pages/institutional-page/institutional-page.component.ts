import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-institutional-page',
    templateUrl: './institutional-page.component.html',
    styleUrls: ['./institutional-page.component.scss'],
    standalone: true,
    imports: [TranslatePipe_1],
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


