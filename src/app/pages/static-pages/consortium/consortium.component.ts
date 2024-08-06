import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-consortium',
  templateUrl: './consortium.component.html',
  styleUrls: ['./consortium.component.scss'],
  standalone: true,
  imports: [RouterLink],
})
export class ConsortiumComponent implements OnInit {
  constructor(
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – Consortium');
    this.metaService.updateTag({
      name: 'description',
      content: 'Kompakkt Consortium Information.',
    });
  }
}
