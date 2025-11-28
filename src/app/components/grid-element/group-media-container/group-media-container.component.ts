import { Component, computed, input, OnInit } from '@angular/core';
import { GetServerUrlPipe } from 'src/app/pipes/get-server-url.pipe';
import { IGroup } from 'src/common';
import { IsGroupPipe } from '../../../pipes/is-group.pipe';

@Component({
  selector: 'app-group-media-container',
  imports: [IsGroupPipe, GetServerUrlPipe],
  templateUrl: './group-media-container.component.html',
  styleUrl: './group-media-container.component.scss',
})
export class GroupMediaContainerComponent implements OnInit {
  element = input.required<IGroup>();

  allGroupMembers = computed(() => {
    const element = this.element();
    return element
      ? [...element.owners, ...element.members].filter(p => !!p && 'fullname' in p)
      : [];
  });

  ngOnInit(): void {
    console.log(this.element());
  }
}
