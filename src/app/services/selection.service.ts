import { Injectable, signal, computed, Signal, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IEntity, ICompilation, isEntity, EntityAccessRole } from '@kompakkt/common';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private selectedElementsSignal = signal<(IEntity | ICompilation)[]>([]);
  public selectedElements = this.selectedElementsSignal.asReadonly();
  public lastSelectedIndex = signal<number>(-1);

  public isSelectionMode = signal<boolean>(false);

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

  public selectionBoxStyle = signal<{ [key: string]: string }>({});

  //Variables selection-box behaviour
  public isDragging = signal<boolean>(false);
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private scrollAnimationFrame: number | null = null;
  private scrollSpeed = 0;
  private startPageX: number = 0;
  private startPageY: number = 0;
  private currentClientX: number = 0;
  private currentClientY: number = 0;

  public hasSelection: Signal<boolean> = computed(() => {
    return this.selectedElements().length > 0;
  });

  constructor() {
    const router = inject(Router);
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.clearSelection();
      }
    });
  }

  public toggleSelectionMode() {
    this.isSelectionMode.update(value => {
      const newValue = !value;
      if (!newValue) this.clearSelection();
      return newValue;
    });
  }

  public isSelected(element: IEntity | ICompilation): boolean {
    return this.selectedElementsSignal().some(currentElement =>
      this.isSameElement(element, currentElement),
    );
  }

  public updateSelection(
    element: IEntity | ICompilation,
    event?: MouseEvent,
    onCheckbox: boolean = false,
  ) {
    if (!this.isSelectionMode()) return;

    console.log(this.selectedElements());

    this.selectedElementsSignal.update(selection => {
      const elementExists = selection.some(currentElement =>
        this.isSameElement(element, currentElement),
      );

      if (event && (event.shiftKey || event.ctrlKey)) {
        return elementExists
          ? selection.filter(currentElement => !this.isSameElement(element, currentElement))
          : [...selection, element];
      }

      if (onCheckbox) {
        return elementExists
          ? selection.filter(currentElement => !this.isSameElement(element, currentElement))
          : [...selection, element];
      }
      return [element];
    });
  }

  public updateSelectionWithRange(
    element: IEntity | ICompilation,
    allGridElements: (IEntity | ICompilation)[],
  ) {
    if (!this.isSelectionMode()) return;

    const anchorElementIndex = this.lastSelectedIndex();
    const currentIndex = allGridElements.indexOf(element);

    if (anchorElementIndex === -1) {
      this.updateSelection(element);
      return;
    }

    const start = Math.min(anchorElementIndex, currentIndex);
    const end = Math.max(anchorElementIndex, currentIndex);

    this.selectedElementsSignal.update(selection => {
      const elementsToAdd = allGridElements
        .slice(start, end + 1)
        .filter(element => !selection.some(selected => this.isSameElement(element, selected)));
      return [...selection, ...elementsToAdd];
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

  public filterByRole(
    userId: string | undefined,
    role: EntityAccessRole.editor | EntityAccessRole.viewer,
  ) {
    if (!userId) return [];
    return this.selectedElements().filter(
      el => el.access.find(u => u._id === userId)?.role === role,
    );
  }

  public clearSelection() {
    this.selectedElementsSignal.set([]);
    this.isSelectionMode.set(false);
    this.lastSelectedIndex.set(-1);
  }

  selectElementsInRect(
    selectionRect: DOMRect,
    pairs: { element: IEntity | ICompilation; htmlElement: HTMLElement }[],
  ) {
    if (!this.isSelectionMode()) return;
    const selected = pairs
      .filter(({ htmlElement: element }) =>
        this.rectsOverlap(selectionRect, element.getBoundingClientRect()),
      )
      .map(({ element }) => element);

    this.selectedElementsSignal.set(selected);
  }

  onMouseDown(event: MouseEvent) {
    if (!this.isSelectionMode()) return;
    this.isDragging.set(true);

    this.startPageX = event.clientX + window.scrollX;
    this.startPageY = event.clientY + window.scrollY;
    this.currentClientX = event.clientX;
    this.currentClientY = event.clientY;

    this.updateBoxStyle();

    this.boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    document.addEventListener('mousemove', this.boundMouseMove);
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isSelectionMode() || !this.isDragging()) return;
    this.currentClientX = event.clientX;
    this.currentClientY = event.clientY;
    this.updateBoxStyle();
    this.updateScrollSpeed(event);
  }

  stopDragging() {
    this.isDragging.set(false);
    this.selectionBoxStyle.set({});
    this.stopScrollAnimation();

    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
      this.boundMouseMove = null;
    }
  }

  public rectsOverlap(a: DOMRect, b: DOMRect): boolean {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  public getCurrentBoxRect(): DOMRect | null {
    const box = document.querySelector('.selection-box');
    return box ? box.getBoundingClientRect() : null;
  }

  private updateScrollSpeed(event: MouseEvent) {
    const threshold = 80;
    const viewportHeight = window.innerHeight;

    if (event.clientY > viewportHeight - threshold) {
      this.scrollSpeed = ((event.clientY - (viewportHeight - threshold)) / threshold) * 12;
      this.startScrollAnimation();
    } else if (event.clientY < threshold) {
      this.scrollSpeed = -((threshold - event.clientY) / threshold) * 12;
      this.startScrollAnimation();
    } else {
      this.scrollSpeed = 0;
      this.stopScrollAnimation();
    }
  }

  private updateBoxStyle() {
    const startClientX = this.startPageX - window.scrollX;
    const startClientY = this.startPageY - window.scrollY;

    this.selectionBoxStyle.set({
      left: `${Math.min(startClientX, this.currentClientX)}px`,
      top: `${Math.min(startClientY, this.currentClientY)}px`,
      width: `${Math.abs(this.currentClientX - startClientX)}px`,
      height: `${Math.abs(this.currentClientY - startClientY)}px`,
    });
  }

  private startScrollAnimation() {
    if (this.scrollAnimationFrame !== null) return;
    const loop = () => {
      window.scrollBy(0, this.scrollSpeed);
      this.updateBoxStyle();
      this.scrollAnimationFrame = requestAnimationFrame(loop);
    };
    this.scrollAnimationFrame = requestAnimationFrame(loop);
  }

  private stopScrollAnimation() {
    if (this.scrollAnimationFrame !== null) {
      cancelAnimationFrame(this.scrollAnimationFrame);
      this.scrollAnimationFrame = null;
    }
  }
}
