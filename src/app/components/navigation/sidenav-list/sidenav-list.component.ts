import {
  Component,
  EventEmitter,
  inject,
  input,
  InputSignal,
  output,
  Output,
  OutputEmitterRef,
} from '@angular/core';
import { TranslateService } from '../../../services/translate.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MatDivider, MatDividerModule } from '@angular/material/divider';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterModule } from '@angular/router';
import { MatNavList, MatListItem, MatListModule } from '@angular/material/list';
import { SidenavComponent, SidenavService } from 'src/app/services/sidenav.service';
import { DialogHelperService } from 'src/app/services';

@Component({
  selector: 'app-sidenav-list',
  templateUrl: './sidenav-list.component.html',
  styleUrls: ['./sidenav-list.component.scss'],
  imports: [MatListModule, RouterModule, MatIconModule, MatDividerModule, TranslatePipe],
})
export class SidenavListComponent implements SidenavComponent {
  title: string = 'Kompakkt';
  dataInput = input<unknown>();
  resultChanged = output<unknown>();

  sidenavService = inject(SidenavService);
  dialogHelper = inject(DialogHelperService);

  close() {
    this.sidenavService.close();
  }
}
