import { Component, inject } from '@angular/core';

import { ExtenderSlotDirective, PLUGIN_MANAGER } from '../../../../../Plugins/extender/src';
import { HelloWorldPlugin } from '../../../../../Plugins/plugins/hello-world/src';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [ExtenderSlotDirective],
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss',
})
export class DebugComponent {
  #pluginManager = inject(PLUGIN_MANAGER);
  #helloWorldPlugin = inject((HelloWorldPlugin as any).providerToken!);

  constructor() {
    console.log(this.#pluginManager);
    console.log(this.#helloWorldPlugin);
  }

  debugEvent(event: unknown) {
    console.log(event);
  }
}
