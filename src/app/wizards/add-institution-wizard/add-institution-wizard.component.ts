import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';

import { BackendService } from '../../services/backend.service';

@Component({
  selector: 'app-add-institution-wizard',
  templateUrl: './add-institution-wizard.component.html',
  styleUrls: ['./add-institution-wizard.component.scss'],
})
export class AddInstitutionWizardComponent {
  constructor(
    @Optional() public dialogRef: MatDialogRef<AddInstitutionWizardComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      institution: FormGroup | undefined;
      entityID: string;
      hideRoleSelection: boolean;
    },
    private backend: BackendService,
  ) {}

  public tryFinish() {
    if (!this.dialogRef || !this.data.institution) return;
    this.data.institution.markAllAsTouched();
    let valid = false;
    console.log(this.data.institution);
    try {
      (this.data.institution.controls.addresses as FormGroup).controls[
        this.data.entityID
      ].updateValueAndValidity();

      (this.data.institution.controls
        .addresses as FormGroup).updateValueAndValidity();

      valid = this.data.institution.valid;
    } catch (err) {
      console.error(err);
    }

    console.log(valid);
    if (!valid) return;

    this.backend
      .pushInstitution(this.data.institution.getRawValue())
      .then(result => {
        console.log('Saved to server:', result);
        this.dialogRef.close(this.data.institution);
      })
      .catch(error => console.error(error));
  }
}
