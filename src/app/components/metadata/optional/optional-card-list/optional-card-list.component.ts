import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MapKeyPipe } from 'src/app/pipes/map-key.pipe';
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';

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

  // public editable: boolean = false;

  constructor(private metadataCommunicationService: MetadataCommunicationService) {}

  isSpecialType(type: string): boolean {
    return ['dimension', 'biblio'].includes(type);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  public onRemove(index: number) {
    this.optionalData.splice(index, 1);
  }

  public onSelectData(index) {
    this.metadataCommunicationService.selectMetadata(this.optionalData[index], index);
  }

}
