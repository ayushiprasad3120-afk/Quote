import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/config/services.config";
import { states, getStateBySlug } from "@/config/states.config";
import { StatePageTemplate } from "@/components/services/state-page-template";
import { buildMetadata } from "@/lib/seo/metadata";

const SERVICE_SLUG = "auto";

// ISR: state/city pages regenerate at most once per hour rather than
// on every request, since underlying state/DOI data changes rarely.
export const revalidate = 3600;

export function generateStaticParams() {
  return states.map((s) => ({ state: s.slug }));
}

export function generateMetadata({ params }: { params: { state: string } }): Metadata {
  const service = getServiceBySlug(SERVICE_SLUG)!;
  const state = getStateBySlug(params.state);
  if (!state) return {};
  return buildMetadata({
    path: `/insurance/${SERVICE_SLUG}/${params.state}`,
    title: `${service.name} in ${state.name} | InsureDirect`,
    description: `Compare ${service.name.toLowerCase()} coverage options in ${state.name} and connect with a licensed agent.`,
  });
}

export default function StatePage({ params }: { params: { state: string } }) {
  const service = getServiceBySlug(SERVICE_SLUG)!;
  const state = getStateBySlug(params.state);
  if (!state) notFound();
  return <StatePageTemplate service={service} state={state} />;
}
