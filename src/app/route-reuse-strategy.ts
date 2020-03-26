import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  Route,
  RouteReuseStrategy,
} from '@angular/router';

export class RouteReuse implements RouteReuseStrategy {
  routesToCache: string[] = ['explore'];
  storedRouteHandles = new Map<string, DetachedRouteHandle>();

  // Decides if the route should be stored
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (route.routeConfig && route.routeConfig.path) {
      return this.routesToCache.includes(route.routeConfig.path.split('/')[0]);
    }
    return false;
  }

  // Store the information for the route we're destructing
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (route.routeConfig && route.routeConfig.path) {
      this.storedRouteHandles.set(route.routeConfig.path, handle);
    }
  }

  // Return true if we have a stored route object for the next route
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (route.routeConfig && route.routeConfig.path) {
      return this.storedRouteHandles.has(route.routeConfig.path);
    }
    return false;
  }

  // If we returned true in shouldAttach(), now return the actual route data for restoration
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    return this.storedRouteHandles.get(
      (route.routeConfig as Route).path as string,
    ) as DetachedRouteHandle;
  }

  // Reuse the route if we're going to and from the same route
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
