import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-creation-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './creation-card.component.html',
  styleUrl: './creation-card.component.scss',
})
export class CreationCardComponent {
  @Input() entity!: any;

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
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
