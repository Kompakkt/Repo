import { Component, input, OnInit } from '@angular/core';
import { IGroup } from 'src/common';
import { IsGroupPipe } from '../../../pipes/is-group.pipe';

@Component({
  selector: 'app-group-media-container',
  imports: [IsGroupPipe],
  templateUrl: './group-media-container.component.html',
  styleUrl: './group-media-container.component.scss',
})
export class GroupMediaContainerComponent implements OnInit {
  ngOnInit(): void {
    console.log(this.element().members);
  }
  element = input.required<IGroup>();
}
