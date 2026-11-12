export type WrappedModel<T> = T & {
  __kind: string;
  __prefilled: boolean;
  __editing: Array<keyof T>;
};
export type UnwrappedModelKeys<T> = keyof Omit<
  WrappedModel<T>,
  '__kind' | '__prefilled' | '__editing'
>;

export const createWrappedModel = <T>(obj: T, kind = 'default'): WrappedModel<T> => {
  return {
    ...obj,
    __editing: [],
    __kind: kind,
    __prefilled: false,
  };
};
