import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';
import { TranslatePipe as TranslatePipe_1 } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [TranslatePipe_1],
})
export class AboutComponent implements OnInit {
  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translatePipe.transform('Contact'));
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt contact informations.',
    });
  }
}
