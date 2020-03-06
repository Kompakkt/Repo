import { Component, OnInit } from '@angular/core';
import {Meta, Title} from '@angular/platform-browser';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  constructor(
      private titleService: Title,
      private metaService: Meta,
      ) {}

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Contact`);
    this.metaService.updateTag({ name: 'description', content: 'Kompakkt contact informations.' });
  }
}
