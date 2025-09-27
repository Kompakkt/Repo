import { Component, computed, input, OnInit } from '@angular/core';
import { IGroup } from 'src/common';
import { IsGroupPipe } from '../../../pipes/is-group.pipe';

@Component({
  selector: 'app-group-media-container',
  imports: [IsGroupPipe],
  templateUrl: './group-media-container.component.html',
  styleUrl: './group-media-container.component.scss',
})
export class GroupMediaContainerComponent implements OnInit {
  element = input.required<IGroup>();

  allGroupMembers = computed(() => {
    const element = this.element();
    if (!element) return undefined;

    return [element.owners, ...element.members];
  });

  ngOnInit(): void {
    console.log(this.element());
  }
}
