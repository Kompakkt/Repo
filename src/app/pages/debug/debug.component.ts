import { Component, inject } from '@angular/core';

import { ExtenderSlotDirective, PLUGIN_MANAGER } from '@kompakkt/extender';
import { HelloWorldPlugin } from '@kompakkt/plugin-hello-world';

@Component({
    selector: 'app-debug',
    imports: [ExtenderSlotDirective],
    templateUrl: './debug.component.html',
    styleUrl: './debug.component.scss'
})
export class DebugComponent {
  #pluginManager = inject(PLUGIN_MANAGER as any);
  #helloWorldPlugin = inject((HelloWorldPlugin as any).providerToken!);

  constructor() {
    console.log(this.#pluginManager);
    console.log(this.#helloWorldPlugin);
  }

  debugEvent(event: unknown) {
    console.log(event);
  }
}
