import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-explore-filter-sidenav-toggle',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './explore-filter-sidenav-toggle.component.html',
  styleUrl: './explore-filter-sidenav-toggle.component.scss',
})
export class ExploreFilterSidenavToggleComponent {
  numFilterOptions = input<number>(0);
}
