import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateService } from '../../../services/translate.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatNavList, MatListItem } from '@angular/material/list';

@Component({
    selector: 'app-sidenav-list',
    templateUrl: './sidenav-list.component.html',
    styleUrls: ['./sidenav-list.component.scss'],
    imports: [MatNavList, MatListItem, RouterLink, MatIcon, MatDivider, TranslatePipe]
})
export class SidenavListComponent {
  @Output() sidenavClose = new EventEmitter();

  public onSidenavClose = () => {
    this.sidenavClose.emit();
  };
}
