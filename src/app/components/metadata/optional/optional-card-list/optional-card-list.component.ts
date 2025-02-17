import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MapKeyPipe } from 'src/app/pipes/map-key.pipe';

@Component({
  selector: 'app-optional-card-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatIcon, 
    MatIconButton,
    MapKeyPipe
  ],
  templateUrl: './optional-card-list.component.html',
  styleUrl: './optional-card-list.component.scss'
})
export class OptionalCardListComponent {
  @Input() optionalData: any;
  @Input() propertyType: string = '';

  constructor() {}

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  public onRemove(index: number) {
    this.optionalData.splice(index, 1);
  }

}
