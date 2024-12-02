import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Meta, Title } from '@angular/platform-browser';
import { TranslatePipe } from 'src/app/pipes';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [TranslatePipe, MatIcon],
})
export class AboutComponent implements OnInit {
  teams = [
    {
      name: 'Department of Digital Humanities',
      logoUrl: 'assets/images/IDH-logo.png',
      projectCoordinators: [
        {
          name: 'Prof. Dr. Øyvind Eide',
          url: 'https://gitlab.com/oyvindeide',
        },
      ],
      developers: [
        {
          name: 'Nadjim Noori',
          url: 'https://github.com/NadNo12',
        },
        {
          name: 'Senya Bär',
          url: 'https://github.com/Grizzly127',
        },
        {
          name: 'Vera Marlieske',
          url: 'https://github.com/vmalieske',
        },
      ],
    },
    {
      name: 'Technische Informationsbibliothek (TIB)',
      logoUrl: 'assets/images/TIB_Logo.png',
      projectCoordinators: [
        {
          name: 'Prof. Dr. Ina Blümel',
          url: 'https://gitlab.com/inablu',
        },
        {
          name: 'Dr. Lozana Rossenova',
          url: 'https://github.com/lozanaross',
        },
        {
          name: 'Zoe Schubert',
          url: 'https://github.com/ZetOE',
        },
      ],
      developers: [
        {
          name: 'Kai Niebes',
          url: 'https://github.com/HeyItsBATMAN',
        },
        {
          name: 'Kolja Bailly',
          url: 'https://gitlab.com/BaillyK',
        },
        {
          name: 'Lukas Günther',
          url: 'https://github.com/luguenth',
        },
        {
          name: 'Lucia Sohmen',
          url: 'https://gitlab.com/sohmenl',
        },
      ],
    },
  ];

  constructor(
    private translatePipe: TranslatePipe,
    private titleService: Title,
    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.titleService.setTitle('Kompakkt – ' + this.translatePipe.transform('About'));
    this.metaService.updateTag({
      name: 'description',
      content: 'About Kompakkt',
    });
  }
}
