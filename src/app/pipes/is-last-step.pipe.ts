import { CdkStep, CdkStepper } from '@angular/cdk/stepper';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'isLastStep', pure: false })
export class IsLastStepPipe implements PipeTransform {
  transform(step: CdkStep, stepper: CdkStepper): boolean {
    const steps = stepper.steps.toArray();
    const currentIndex = steps.findIndex(s => s === step);
    return currentIndex === steps.length - 1;
  }
}
