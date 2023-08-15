import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateService } from './../../../services/translate/translate.service';

@Component({
  selector: 'app-sidenav-list',
  templateUrl: './sidenav-list.component.html',
  styleUrls: ['./sidenav-list.component.scss'],
})
export class SidenavListComponent {
  @Output() sidenavClose = new EventEmitter();

  constructor(private translate: TranslateService) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  };
}
