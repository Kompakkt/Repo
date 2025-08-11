import { environment } from 'src/environment';

/**
 * Constructs a full server URL based on the provided path.
 * If the server URL in the environment configuration does not start with 'http',
 * it is assumed to be a relative path and is combined with the current window's origin.
 */
export const getServerUrl = (path: string): string => {
  const serverUrl = environment.server_url.startsWith('http')
    ? environment.server_url
    : new URL(environment.server_url, window.location.origin).toString();
  return new URL(path, serverUrl).toString();
};
