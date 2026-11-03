import { Component, computed, effect, model, OnInit } from '@angular/core';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { OutlinedInputComponent } from '../../outlined-input/outlined-input.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { isFreeLicence, Licences } from '../../../metadata/licences';
import { KeyValuePipe } from '@angular/common';
import { IDigitalEntityResolved } from '@kompakkt/common';
import { applyWhen, form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'app-licence',
  imports: [
    FormField,
    KeyValuePipe,
    MatIconModule,
    MatRadioModule,
    OutlinedInputComponent,
    TranslatePipe,
  ],
  templateUrl: './licence.component.html',
  styleUrl: './licence.component.scss',
})
export class LicenceComponent implements OnInit {
  entity = model.required<IDigitalEntityResolved>();

  licenceModel = model({ licence: '', attribution: '' });
  licenceForm = form(this.licenceModel, path => {
    required(path.licence, { message: 'Licence is required' });
    applyWhen(
      path,
      ({ value }) => value().licence.length > 0 && !isFreeLicence(value().licence),
      ctx => {
        required(ctx.attribution, { message: 'This licence requires an attribution' });
      },
    );
  });
  _formChangedEffectRef = effect(() => {
    const data = this.licenceForm().value();
    this.entity.update(entity => ({
      ...entity,
      licence: data.licence,
      licenceAttribution: data.attribution,
    }));
  });

  public availableLicences = Licences;

  requiresAttribution = computed(() => {
    const key = this.licenceForm.licence().value();
    return !!key && !isFreeLicence(key);
  });

  onLicenceChange({ value }: MatRadioChange<string>) {
    this.licenceModel.update(m => ({ ...m, licence: value }));
  }

  ngOnInit() {
    const { licence, licenceAttribution } = this.entity();
    this.licenceModel.update(m => ({ licence, attribution: licenceAttribution ?? m.attribution }));
  }
}
