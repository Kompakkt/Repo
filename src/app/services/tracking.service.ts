import { Injectable } from "@angular/core";

import { environment } from "../../environments/environment";

declare const window: {
  [key: string]: any;
  prototype: Window;
  new(): Window;
};

@Injectable({
  providedIn: "root"
})
export class TrackingService {
  constructor() {
    window._paq = window._paq || [];
  }

  public init() {
    // window._paq.push(["requireCookieConsent"]);
    window._paq.push(['disableCookies']);

    window._paq.push(["trackPageView"]);
    window._paq.push(["enableLinkTracking"]);

    (() => {
      window._paq.push(["setTrackerUrl", `${environment.tracking_url}matomo.php`]);
      window._paq.push(["setSiteId", environment.tracking_id]);

      const newScriptElement = document.createElement("script");
      newScriptElement.type = "text/javascript";
      newScriptElement.async = true;
      newScriptElement.defer = true;
      newScriptElement.src = `${environment.tracking_url}matomo.js`;

      const firstScript = document.getElementsByTagName("script")[0];
      if (!firstScript.parentNode) return;
      firstScript.parentNode.insertBefore(newScriptElement, firstScript);
    })();
  }

  public trackPageView(title: string) {
    // Cf. https://developer.matomo.org/guides/spa-tracking
    window._paq.push(["setCustomUrl", window.location.href]);
    window._paq.push(["setDocumentTitle", title]);
    window._paq.push(["deleteCustomVariables", "page"]);
    window._paq.push(["setGenerationTimeMs", 0]);
    window._paq.push(["trackPageView"]);

    window._paq.push(["enableLinkTracking"]);
  }
}
