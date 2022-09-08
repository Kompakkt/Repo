import { Component, OnInit } from '@angular/core';
import { SelectHistoryService } from '~services';

@Component({
  selector: 'app-selection-history-button',
  templateUrl: './selection-history-button.component.html',
  styleUrls: ['./selection-history-button.component.scss'],
})
export class SelectionHistoryButtonComponent implements OnInit {
  constructor(public selectHistory: SelectHistoryService) {}

  ngOnInit(): void {}
}
