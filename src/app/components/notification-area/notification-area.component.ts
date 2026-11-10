import { Component, inject, Injectable, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import ObjectId from 'bson-objectid';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<
    {
      id: string;
      message: string[];
      type: 'warn' | 'info';
      seconds: number;
      status: 'visible' | 'hidden';
      icon?: string;
    }[]
  >([]);

  showNotification({
    message,
    type,
    seconds = 10,
    icon,
  }: {
    message: string | string[];
    type: 'warn' | 'info';
    seconds?: number;
    icon?: string;
  }) {
    const id = new ObjectId().toString();
    this.notifications.update(arr => [
      ...arr,
      {
        message: Array.isArray(message) ? message.map(v => v.trim()) : [message.trim()],
        type,
        seconds,
        status: 'visible',
        icon,
        id,
      },
    ]);
    setTimeout(() => {
      this.notifications.update(arr =>
        arr.map(n => (n.id !== id ? n : { ...n, status: 'hidden' })),
      );
    }, seconds * 1000);
  }

  dismissNotification(id: string) {
    this.notifications.update(arr => arr.map(n => (n.id !== id ? n : { ...n, status: 'hidden' })));
  }

  removeNotification(id: string) {
    this.notifications.update(arr => arr.filter(n => n.id !== id));
  }
}

@Component({
  selector: 'app-notification-area',
  imports: [NgxFluentPipe, MatIconModule],
  templateUrl: './notification-area.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './notification-area.component.scss',
})
export class NotificationAreaComponent {
  service = inject(NotificationService);

  onDismiss(id: string) {
    this.service.dismissNotification(id);
  }

  onTransitionEnd(id: string) {
    this.service.removeNotification(id);
  }
}
