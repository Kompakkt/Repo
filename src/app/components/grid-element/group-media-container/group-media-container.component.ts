import { Component, computed, input, OnInit, Pipe, PipeTransform, Signal } from '@angular/core';
import { IGroup, IStrippedUserData } from 'src/common';
import { IsGroupPipe } from '../../../pipes/is-group.pipe';
import { GetServerUrlPipe } from 'src/app/pipes/get-server-url.pipe';

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
