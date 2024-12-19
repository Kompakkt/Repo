import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-creation-card',
  standalone: true,
  imports: [CommonModule, MatIcon, MatIconButton],
  templateUrl: './creation-card.component.html',
  styleUrl: './creation-card.component.scss',
})
export class CreationCardComponent {
  @Input() entity!: any;
  @Output() remove = new EventEmitter<any>();

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  public onRemove(property: string, index: number, propertyKey: string) {
    this.remove.emit({ property, index, propertyKey });
  }

  //ToDo:
  //1. Ausgabe nur, wenn Wert vorhanden
  //2. Validation muss raus (CreationTuple.checkIsValid)
  //3. Styling!

  // getFieldValues(field: string): string[] {
  //   return this.entity.creation.map(creation => creation[field]).filter(value => value);
  // }

  // hasFieldValues(field: string): boolean {
  //   return this.getFieldValues(field).length > 0;
  // }
}
