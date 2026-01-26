import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-explore-filter-sidenav-toggle',
  imports: [MatIconModule],
  templateUrl: './explore-filter-sidenav-toggle.component.html',
  styleUrl: './explore-filter-sidenav-toggle.component.scss',
  host: {
    '[class.has-active-filters]': 'numFilterOptions() > 0',
  },
})
export class ExploreFilterSidenavToggleComponent {
  numFilterOptions = input.required<number>();
}
