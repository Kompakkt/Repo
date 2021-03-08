import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';

import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-add-person-wizard',
  templateUrl: './add-person-wizard.component.html',
  styleUrls: ['./add-person-wizard.component.scss'],
})
export class AddPersonWizardComponent {
  constructor(
    @Optional() public dialogRef: MatDialogRef<AddPersonWizardComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      person: FormGroup | undefined;
      entityID: string;
    },
    private backend: BackendService,
  ) {}

  public tryFinish() {
    if (!this.dialogRef) return;
    if (!this.data.person) return;
    this.data.person.markAllAsTouched();
    let valid = false;
    try {
      (this.data.person.controls.contact_references as FormGroup).controls[
        this.data.entityID
      ].updateValueAndValidity();

      (this.data.person.controls.contact_references as FormGroup).updateValueAndValidity();

      valid = this.data.person.valid;
    } catch (err) {
      console.error(err);
    }

    console.log(valid);
    if (!valid) return;

    this.backend
      .pushPerson(this.data.person.getRawValue())
      .then(result => {
        console.log('Saved to server:', result);
        this.dialogRef.close(this.data.person);
      })
      .catch(error => console.error(error));
  }
}
