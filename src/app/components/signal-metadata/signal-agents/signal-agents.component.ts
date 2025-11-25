import { Component, input, WritableSignal } from '@angular/core';
import { Field, FieldTree, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { createPerson } from '../index';
import { TranslatePipe } from 'src/app/pipes';
import { IDigitalEntity } from 'src/common';
import { IBaseSignalChildComponent, IDigitalEntityForm } from '../base-signal-child-component';

@Component({
  selector: 'app-signal-agents',
  imports: [
    Field,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './signal-agents.component.html',
  styleUrl: './signal-agents.component.scss',
})
export class SignalAgentsComponent implements IBaseSignalChildComponent {
  entityForm = input.required<IDigitalEntityForm>();

  addPerson() {
    this.entityForm()().value.update(state => ({
      ...state,
      persons: [...state.persons, createPerson()],
    }));
  }
}
