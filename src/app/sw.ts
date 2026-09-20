import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";
import {
  OFFLINE_FALLBACK_PATH,
  isShellNavigationFallbackRequest,
  shouldBypassRuntimeCache,
} from "@/features/pwa/offlineShellPolicy";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Runtime cache: Serwist Next defaults, with explicit NetworkOnly for:
 * - /plantel* (private member directory — no offline social graph)
 * - supabase hosts (API/storage)
 */
const shellAwareRuntimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ url, sameOrigin }) =>
      shouldBypassRuntimeCache({
        pathname: url.pathname,
        sameOrigin,
        hostname: url.hostname,
      }),
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  // Serwist injects the precache list at this injection point (self.__SW_MANIFEST).
  precacheEntries: self["__SW_MANIFEST"],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: shellAwareRuntimeCaching,
  fallbacks: {
    entries: [
      {
        url: OFFLINE_FALLBACK_PATH,
        matcher({ request }) {
          return isShellNavigationFallbackRequest({
            destination: request.destination,
            mode: request.mode,
          });
        },
      },
    ],
  },
});

serwist.addEventListeners();
