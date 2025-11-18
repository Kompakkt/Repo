import { Pipe, PipeTransform } from '@angular/core';

// Define types for Math methods that accept number arguments
type MathMethodWithArgs = {
  [K in keyof typeof Math]: (typeof Math)[K] extends (...args: number[]) => number ? K : never;
}[keyof typeof Math];

@Pipe({ name: 'math' })
export class MathPipe implements PipeTransform {
  // Overload for methods that take a single number
  transform(
    value: number,
    method:
      | 'abs'
      | 'acos'
      | 'acosh'
      | 'asin'
      | 'asinh'
      | 'atan'
      | 'atanh'
      | 'cbrt'
      | 'ceil'
      | 'clz32'
      | 'cos'
      | 'cosh'
      | 'exp'
      | 'expm1'
      | 'floor'
      | 'fround'
      | 'log'
      | 'log10'
      | 'log1p'
      | 'log2'
      | 'round'
      | 'sign'
      | 'sin'
      | 'sinh'
      | 'sqrt'
      | 'tan'
      | 'tanh'
      | 'trunc',
  ): number;

  // Overload for methods that take two numbers
  transform(values: [number, number], method: 'atan2' | 'pow'): number;

  // Overload for methods that take variable number of arguments
  transform(values: number[], method: 'max' | 'min' | 'hypot'): number;

  // Overload for imul (takes exactly two 32-bit integers)
  transform(values: [number, number], method: 'imul'): number;

  // Generic fallback
  transform(values: number | number[], method: MathMethodWithArgs): number | null;

  // Implementation
  transform(values: number | number[], method: MathMethodWithArgs): number | null {
    const valuesArray = Array.isArray(values) ? values : [values];

    if (valuesArray.length === 0) {
      return null;
    }

    const mathMethod = Math[method];
    if (typeof mathMethod !== 'function') {
      return null;
    }

    return (mathMethod as (...args: number[]) => number)(...valuesArray);
  }
}
