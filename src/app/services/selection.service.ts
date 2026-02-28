import { Injectable, signal, computed, Signal } from '@angular/core';
import { IEntity, ICompilation, isEntity, isCompilation } from 'src/common';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private selectedElementsSignal = signal<(IEntity | ICompilation)[]>([]);
  public selectedElements = this.selectedElementsSignal.asReadonly();

  public singleSelected: Signal<IEntity | ICompilation | null> = computed(() => {
    const sel = this.selectedElementsSignal();
    return sel.length === 1 ? sel[0] : null;
  });

  public singleSelectedEntity: Signal<IEntity | null> = computed(() => {
    const selection = this.singleSelected();
    return selection && isEntity(selection) ? (selection as IEntity) : null;
  });

  public singleSelectedCompilation: Signal<ICompilation | null> = computed(() => {
    const selection = this.singleSelected();
    return selection && !isEntity(selection) ? (selection as ICompilation) : null;
  });

  public isDragging = signal<boolean>(false);
  private startX: number = 0;
  private startY: number = 0;
  public selectionBoxStyle = signal<{ [key: string]: string }>({});

  public hasSelection: Signal<boolean> = computed(() => {
    return this.selectedElements().length > 0;
  });

  public isSelected(element: IEntity | ICompilation): boolean {
    return this.selectedElementsSignal().some(currentElement =>
      this.isSameElement(element, currentElement),
    );
  }

  public addToSelection(element: IEntity | ICompilation, event: MouseEvent) {
    this.selectedElementsSignal.update(selection => {
      const elementExists = selection.some(currentElement =>
        this.isSameElement(element, currentElement),
      );

      if (event.shiftKey || event.ctrlKey) {
        if (elementExists) {
          return selection.filter(currentElement => !this.isSameElement(element, currentElement));
        } else {
          return [...selection, element];
        }
      } else {
        return [element];
      }
    });
  }

  private isSameElement(
    element: IEntity | ICompilation,
    currentElement: IEntity | ICompilation,
  ): boolean {
    return isEntity(element) && isEntity(currentElement)
      ? element.relatedDigitalEntity._id === currentElement.relatedDigitalEntity._id
      : element._id === currentElement._id;
  }

  public filterByRole(userId: string | undefined, role: 'editor' | 'viewer') {
    if (!userId) return [];
    return this.selectedElements().filter(el => el.access?.[userId]?.role === role);
  }

  public clearSelection() {
    this.selectedElementsSignal.set([]);
  }

  selectElementsInRect(
    selectionRect: DOMRect,
    pairs: { element: IEntity | ICompilation; htmlElement: HTMLElement }[],
  ) {
    const selected = pairs
      .filter(({ htmlElement: element }) =>
        this.rectsOverlap(selectionRect, element.getBoundingClientRect()),
      )
      .map(({ element: element }) => element);

    this.selectedElementsSignal.set(selected);
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging.set(true);
    this.startX = event.clientX;
    this.startY = event.clientY;

    this.selectionBoxStyle.set({
      width: '0px',
      height: '0px',
      left: `${this.startX}px`,
      top: `${this.startY}px`,
    });
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging()) {
      const width = event.clientX - this.startX;
      const height = event.clientY - this.startY;
      const left = this.startX < event.clientX ? this.startX : event.clientX;
      const top = this.startY < event.clientY ? this.startY : event.clientY;

      this.selectionBoxStyle.set({
        width: `${Math.abs(width)}px`,
        height: `${Math.abs(height)}px`,
        left: `${left}px`,
        top: `${top}px`,
      });
    }
  }

  stopDragging() {
    this.isDragging.set(false);
    this.selectionBoxStyle.set({});
  }

  public rectsOverlap(a: DOMRect, b: DOMRect): boolean {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  public getCurrentBoxRect(): DOMRect | null {
    const box = document.querySelector('.selection-box');
    return box ? box.getBoundingClientRect() : null;
  }
}
