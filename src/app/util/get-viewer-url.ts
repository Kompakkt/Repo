import { environment } from 'src/environment';

/**
 * Constructs a full viewer URL
 */
export const getViewerUrl = (): string => {
  const viewerUrl = environment.viewer_url.startsWith('http')
    ? environment.viewer_url
    : new URL(environment.viewer_url, window.location.origin).toString();
  return new URL(viewerUrl).toString();
};
