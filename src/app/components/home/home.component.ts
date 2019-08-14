import { Component, OnInit } from '@angular/core';

import { ParticlesConfig } from '../../../assets/particles-config';
import { environment } from '../../../environments/environment';

declare var particlesJS: any;

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

  ngOnInit() {
    particlesJS('particles', ParticlesConfig, () => {});
  }
}
