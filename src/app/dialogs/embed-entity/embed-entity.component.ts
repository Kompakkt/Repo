import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-embed-entity',
  templateUrl: './embed-entity.component.html',
  styleUrls: ['./embed-entity.component.scss'],
})
export class EmbedEntityComponent implements OnInit {
  public viewerUrl: string;

  constructor(@Inject(MAT_DIALOG_DATA) public id: string) {
    this.viewerUrl = `${environment.kompakkt_url}?entity=${this.id}&mode=open`;
  }

  ngOnInit() {}
}
