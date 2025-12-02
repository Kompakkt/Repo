import { Component, computed, input, OnInit } from '@angular/core';
import { GetServerUrlPipe } from 'src/app/pipes/get-server-url.pipe';
import { IGroup, IPublicProfile } from 'src/common';
import { IsGroupPipe } from '../../../pipes/is-group.pipe';
import { IStrippedUserData } from 'src/@kompakkt/plugins/extender/src/common';

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

  previewMembers = computed(() => {
    const members = this.allGroupMembers();
    const membersWithProfilePic = members.filter(m => m.profile?.imageUrl);
    const membersWithoutProfilePic = members.filter(m => !m.profile?.imageUrl);

    const result: IGroup['members'] = [];

    result.push(...membersWithProfilePic.slice(0, 3));

    if (result.length < 3 && membersWithoutProfilePic.length > 0) {
      const shuffledMembers = [...membersWithoutProfilePic].sort(() => Math.random() - 0.5);
      result.push(...shuffledMembers.slice(0, 3 - result.length));
    }

    return result;
  });

  ngOnInit(): void {
    console.log(this.element());
  }
}
