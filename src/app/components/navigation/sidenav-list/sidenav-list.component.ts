import { AsyncPipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { ObservableValuePipe } from 'src/app/pipes/observable-value';
import { AccountService, DialogHelperService } from 'src/app/services';
import { SidenavComponent, SidenavService } from 'src/app/services/sidenav.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-sidenav-list',
  templateUrl: './sidenav-list.component.html',
  styleUrls: ['./sidenav-list.component.scss'],
  imports: [
    MatListModule,
    RouterModule,
    MatIconModule,
    MatDividerModule,
    TranslatePipe,
    AsyncPipe,
    ObservableValuePipe,
    MatProgressBarModule,
  ],
})
export class SidenavListComponent implements SidenavComponent {
  title = signal('Navigation');
  dataInput = input<unknown>();
  resultChanged = output<unknown>();

  sidenavService = inject(SidenavService);
  dialogHelper = inject(DialogHelperService);
  account = inject(AccountService);

  close() {
    this.sidenavService.close();
  }
}
