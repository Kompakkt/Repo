import { Component, OnInit } from '@angular/core';
import { TranslatePipe } from 'src/app/pipes';
import { MatButton } from '@angular/material/button';


@Component({
    selector: 'app-create-institutional-profile',
    templateUrl: './create-institutional-profile.component.html',
    styleUrls: ['../settings-style.component.scss',
                './create-institutional-profile.component.scss'],
    standalone: true,
    imports: [
      TranslatePipe, 
      MatButton,
    ],
  })
  export class CreateInstitutionalProfileComponent {
    
  }