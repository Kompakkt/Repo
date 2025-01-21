import { provideExtender } from '@kompakkt/extender';
import { HelloWorldPlugin } from '@kompakkt/plugin-hello-world';
import { TranslatePlugin } from '@kompakkt/plugin-i18n';
import { PrivacyAndContactPlugin } from '@kompakkt/plugin-privacy-and-contact';
import { SemanticKompakktMetadataPlugin } from '@kompakkt/plugin-semantic-kompakkt-metadata';
import { SSONFDI4CulturePlugin } from '@kompakkt/plugin-sso-nfdi4culture';
import { BackendService } from './services';

export const pluginProviders = provideExtender({
  plugins: [
    new HelloWorldPlugin(),
    new TranslatePlugin(),
    new PrivacyAndContactPlugin(),
    new SemanticKompakktMetadataPlugin(),
    new SSONFDI4CulturePlugin(),
  ],
  componentSet: 'repoComponents',
  services: {},
  backendService: BackendService,
});
