import { tracking } from "@/config/tracking.config";
import type { DIDResolutionParams } from "@/types/tracking";

/**
 * Single source of truth for which phone number to display.
 *
 * Precedence: campaign override -> traffic-source override -> service
 * override -> brand default.
 *
 * Every "Call Now" surface (Navbar, Hero, StickyCallBar, FloatingCallButton,
 * CTASection, campaign pages) must go through this function — directly on
 * the server, or via the `useTrackingNumber` hook on the client — rather
 * than reading a phone number from anywhere else. This is what makes
 * swapping in a real call-tracking vendor (CallRail, Twilio, Invoca) later
 * a one-file change: replace the body of this function with a vendor
 * lookup/API call and every consumer updates automatically.
 */
export function resolveDID(params: DIDResolutionParams = {}): string {
  const { campaignSlug, source, service } = params;

  if (campaignSlug && tracking.campaignDIDs[campaignSlug]) {
    return tracking.campaignDIDs[campaignSlug];
  }

  if (source && tracking.sourceDIDs[source]) {
    return tracking.sourceDIDs[source];
  }

  if (service && tracking.serviceDIDs[service]) {
    return tracking.serviceDIDs[service] as string;
  }

  return tracking.defaultDID;
}
