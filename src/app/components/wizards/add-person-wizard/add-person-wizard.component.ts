import { Component, OnInit, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-add-person-wizard',
  templateUrl: './add-person-wizard.component.html',
  styleUrls: ['./add-person-wizard.component.scss'],
})
export class AddPersonWizardComponent implements OnInit {
  constructor(
    @Optional() public dialogRef: MatDialogRef<AddPersonWizardComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      person: FormGroup | undefined;
      entityID: string;
    },
  ) {}

  ngOnInit() {
    console.log(this.data);
  }

  public tryFinish() {
    if (!this.dialogRef) return;
    if (!this.data.person) return;
    let valid = false;
    try {
      (this.data.person.controls.contact_references as FormGroup).controls[
        this.data.entityID
      ].updateValueAndValidity();

      (this.data.person.controls
        .contact_references as FormGroup).updateValueAndValidity();

      valid = this.data.person.valid;
    } catch (err) {
      console.error(err);
    }

    console.log(valid);
    if (!valid) return;

    this.dialogRef.close(this.data.person);
  }
}
