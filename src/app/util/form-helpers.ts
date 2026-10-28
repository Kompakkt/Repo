import { FieldState } from "@angular/forms/signals";

export const getFormErrorMessages = <T>(form: FieldState<T>, kind?: string) => form.errors().filter(error => (kind ? error.kind === kind : true) && !!error.message).map(error => error.message!);
