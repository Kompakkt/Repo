import { provideExtender } from '@kompakkt/extender';
import { BackendService } from './services';
import { TranslatePipe } from './pipes';

import plugins from './custom-plugins';

export const pluginProviders = provideExtender({
  plugins,
  componentSet: 'repoComponents',
  services: {
    backendService: BackendService,
  },
  pipes: {
    translatePipe: TranslatePipe,
  },
});
