import { Component, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';


@Component({
    selector: 'app-memberships',
    templateUrl: './memberships.component.html',
    styleUrls: ['../settings-style.component.scss',
                './memberships.component.scss'],
    standalone: true,
    imports: [
      MatIcon,
    ],
  })
  export class MembershipsComponent {
  }
