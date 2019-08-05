import {Component, OnInit} from '@angular/core';

import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public viewerUrl: string;

  constructor() {
    this.viewerUrl = environment.kompakkt_url;
  }

  ngOnInit() {}
}
