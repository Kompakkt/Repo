import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { HttpErrorResponse } from '@angular/common/http';
import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { BackendService } from 'src/app/services';
import { IUserData } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-upload-application-dialog',
    templateUrl: './upload-application-dialog.component.html',
    styleUrls: ['./upload-application-dialog.component.scss'],
    imports: [
        MatButton,
        FormsModule,
        ReactiveFormsModule,
        MatFormField,
        MatInputModule,
        MatSlideToggle,
        TranslatePipe,
    ]
})
export class UploadApplicationDialogComponent implements OnInit {
  public uploadApplicationForm = new FormGroup({
    prename: new FormControl('', Validators.required),
    surname: new FormControl('', Validators.required),
    mail: new FormControl('', Validators.required),

    institution: new FormControl(''),
    university: new FormControl(''),
    address: new FormGroup({
      country: new FormControl(''),
      postcode: new FormControl(''),
      city: new FormControl(''),
      street: new FormControl(''),
      number: new FormControl(''),
      building: new FormControl(''),
    }),

    motivation: new FormControl('', Validators.required),
  });

  public errorMsg: string = '';

  public requestSuccess = false;

  constructor(
    private backend: BackendService,
    @Inject(MAT_DIALOG_DATA) public data: IUserData | undefined,
    public dialogRef: MatDialogRef<UploadApplicationDialogComponent>,
  ) {}

  get prename() {
    return this.uploadApplicationForm.get('prename') as FormControl;
  }

  get surname() {
    return this.uploadApplicationForm.get('surname') as FormControl;
  }

  get mail() {
    return this.uploadApplicationForm.get('mail') as FormControl;
  }

  get address() {
    return this.uploadApplicationForm.get('address') as FormGroup;
  }

  ngOnInit() {
    if (this.data) {
      this.prename.patchValue(this.data.prename);
      this.surname.patchValue(this.data.surname);
      this.mail.patchValue(this.data.mail);
    } else {
      this.dialogRef.close();
    }
  }

  public trySend() {
    if (!this.uploadApplicationForm.valid) return;
    const val = this.uploadApplicationForm.getRawValue();
    const { motivation, prename, surname, mail, institution, university, address } = val;

    const subject = `[UPLOAD] ${prename} ${surname} - ${mail}`;
    let mailbody = `
Upload application request
Prename: ${prename}
Surname: ${surname}
Mail:    ${mail}\n`;

    mailbody += 'Motivation:\n';

    for (const line of motivation!.split('\n')) mailbody += `> ${line}\n`;

    if (institution!.length > 0) mailbody += `\nInstitution: ${institution}`;
    if (university!.length > 0) mailbody += `\nUniversity: ${university}`;
    if ((Object.values(address) as string[]).some(v => v.length > 0)) {
      mailbody += `\nAddress:     ${address.country}
             ${address.postcode} ${address.city}
             ${address.street} ${address.number}
             ${address.building}`.trim();
    }

    this.backend
      .sendUploadApplicationMail({ subject, mailbody })
      .then(() => (this.requestSuccess = true))
      .catch((error: HttpErrorResponse) => (this.errorMsg = error.error.toString()));
  }
}
