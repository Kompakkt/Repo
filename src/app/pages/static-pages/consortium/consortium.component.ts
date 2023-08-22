import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-consortium',
  templateUrl: './consortium.component.html',
  styleUrls: ['./consortium.component.scss'],
})
export class ConsortiumComponent implements OnInit {
  constructor(private titleService: Title, private metaService: Meta) { }

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Consortium`);
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt Consortium Information.',
    });
  }
}
