import { provideExtender } from '@kompakkt/plugins/extender';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

import plugins from './custom-plugins';
import { BackendService } from './services/backend.service';

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
