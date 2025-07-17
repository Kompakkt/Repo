import { Injectable, signal } from "@angular/core";
import { IEntity } from "src/common";

@Injectable({providedIn: 'root'})
export class SelectionService {
  private selectedEntitiesSignal = signal<IEntity[]>([]);
  public selectedEntities = this.selectedEntitiesSignal.asReadonly();

  public isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  public selectionBoxStyle = signal<{ [key: string]: string }>({});

  public isSelected(entity: IEntity): boolean {
      return this.selectedEntitiesSignal().some(
          currentEntity => currentEntity.relatedDigitalEntity._id === entity.relatedDigitalEntity._id
      );
  }

  public addToSelection(entity: IEntity, event: MouseEvent) {
    this.selectedEntitiesSignal.update((selection) => {
        const entityExists = selection.some(
        currentEntity => currentEntity.relatedDigitalEntity._id === entity.relatedDigitalEntity._id
        );

        if(event.shiftKey) {
        if(entityExists) {
            return selection.filter(
            currentEntity => currentEntity.relatedDigitalEntity._id !== entity.relatedDigitalEntity._id
            );
        } else {
            return [...selection, entity];
        }
        } else {
        return [entity];
        }
    });
  }

  public clearSelection() {
      this.selectedEntitiesSignal.set([]);
  }

  selectEntitiesInRect(
      selectionRect: DOMRect,
      pairs: { entity: IEntity, element: HTMLElement }[]
  ): void {
    const selected = pairs
      .filter(({ element }) =>
        this.rectsOverlap(selectionRect, element.getBoundingClientRect())
      )
      .map(({ entity }) => entity);
  
      this.selectedEntitiesSignal.set(selected);
  }


  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    this.selectionBoxStyle.set({
      width: '0px',
      height: '0px',
      left: `${this.startX}px`,
      top: `${this.startY}px`
    });
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const width = event.clientX - this.startX;
      const height = event.clientY - this.startY;
      const left = this.startX < event.clientX ? this.startX : event.clientX;
      const top = this.startY < event.clientY ? this.startY : event.clientY;

      this.selectionBoxStyle.set({
        width: `${Math.abs(width)}px`,
        height: `${Math.abs(height)}px`,
        left: `${left}px`,
        top: `${top}px`
      });
    } 
  }

  onMouseUp() {
    this.isDragging = false;
    this.selectionBoxStyle.set({});
  }

  onMouseLeave() {
    if(this.isDragging) {
        this.isDragging = false;
        this.selectionBoxStyle.set({});
    }
  }

  public rectsOverlap(a: DOMRect, b: DOMRect): boolean {
    return (
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top
    );
  }

  public getCurrentBoxRect(): DOMRect | null {
    const box = document.querySelector('.selection-box');
    return box ? box.getBoundingClientRect() : null;
  }

}