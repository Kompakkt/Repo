import { Component, OnInit, Inject } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { IUserData } from 'src/common';
import { BackendService } from 'src/app/services';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-upload-application-dialog',
  templateUrl: './upload-application-dialog.component.html',
  styleUrls: ['./upload-application-dialog.component.scss'],
})
export class UploadApplicationDialogComponent implements OnInit {
  public uploadApplicationForm = new UntypedFormGroup({
    prename: new UntypedFormControl('', Validators.required),
    surname: new UntypedFormControl('', Validators.required),
    mail: new UntypedFormControl('', Validators.required),

    institution: new UntypedFormControl(''),
    university: new UntypedFormControl(''),
    address: new UntypedFormGroup({
      country: new UntypedFormControl(''),
      postcode: new UntypedFormControl(''),
      city: new UntypedFormControl(''),
      street: new UntypedFormControl(''),
      number: new UntypedFormControl(''),
      building: new UntypedFormControl(''),
    }),

    motivation: new UntypedFormControl('', Validators.required),
  });

  public errorMsg: string = '';

  public requestSuccess = false;

  constructor(
    private backend: BackendService,
    @Inject(MAT_DIALOG_DATA) public data: IUserData | undefined,
    public dialogRef: MatDialogRef<UploadApplicationDialogComponent>,
  ) {}

  get prename() {
    return this.uploadApplicationForm.get('prename') as UntypedFormControl;
  }

  get surname() {
    return this.uploadApplicationForm.get('surname') as UntypedFormControl;
  }

  get mail() {
    return this.uploadApplicationForm.get('mail') as UntypedFormControl;
  }

  get address() {
    return this.uploadApplicationForm.get('address') as UntypedFormGroup;
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

    for (const line of motivation.split('\n')) mailbody += `> ${line}\n`;

    if (institution.length > 0) mailbody += `\nInstitution: ${institution}`;
    if (university.length > 0) mailbody += `\nUniversity: ${university}`;
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
