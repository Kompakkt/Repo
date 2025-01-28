import { Component, OnInit, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  imports: [TranslatePipe],
})
export class AboutComponent implements OnInit {
  #translatePipe = inject(TranslatePipe);
  #titleService = inject(Title);
  #metaService = inject(Meta);

  ngOnInit(): void {
    const pageTitle = this.#translatePipe.transform('Contact');
    this.#titleService.setTitle(`Kompakkt - ${pageTitle}`);
    this.#metaService.updateTag({ name: 'description', content: 'Kompakkt contact information' });
  }
}
