import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Institution } from '~metadata';
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
      institution: Institution;
      entityId: string;
    },
    private backend: BackendService,
  ) {}

  public cancel() {
    if (this.dialogRef) this.dialogRef.close();
  }

  get isValid() {
    return Institution.checkIsValid(this.data.institution, this.data.entityId);
  }

  public tryFinish() {
    if (!this.isValid) return;
    if (this.dialogRef) this.dialogRef.close(this.data.institution);
  }
}
