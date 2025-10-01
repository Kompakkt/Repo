import { environment } from 'src/environment';

/**
 * Constructs a full server URL based on the provided path.
 * If the server URL in the environment configuration does not start with 'http',
 * it is assumed to be a relative path and is combined with the current window's origin.
 */
export const getServerUrl = (path: string, opts = { randomTimestamp: true }): string => {
  const serverUrl = environment.server_url.startsWith('http')
    ? environment.server_url
    : new URL(environment.server_url, window.location.origin).toString();

  // Some compilations have incorrect server urls
  path = path.replaceAll('https://kompakkt.uni-koeln.de:8080', '/server');

  const url = new URL(path, serverUrl);
  if (opts.randomTimestamp) {
    url.searchParams.set('t', Date.now().toString());
  }
  return url.toString();
};
