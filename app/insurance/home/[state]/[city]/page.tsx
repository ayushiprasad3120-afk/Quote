import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/config/services.config";
import { states, getStateBySlug } from "@/config/states.config";
import { CityPageTemplate } from "@/components/services/city-page-template";
import { buildMetadata } from "@/lib/seo/metadata";

const SERVICE_SLUG = "home";

function citySlugify(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}

// ISR: state/city pages regenerate at most once per hour rather than
// on every request, since underlying state/DOI data changes rarely.
export const revalidate = 3600;

export function generateStaticParams() {
  return states.flatMap((s) => s.servedCities.map((city) => ({ state: s.slug, city: citySlugify(city) })));
}

export function generateMetadata({ params }: { params: { state: string; city: string } }): Metadata {
  const service = getServiceBySlug(SERVICE_SLUG)!;
  const state = getStateBySlug(params.state);
  const city = state?.servedCities.find((c) => citySlugify(c) === params.city);
  if (!state || !city) return {};
  return buildMetadata({
    path: `/insurance/${SERVICE_SLUG}/${params.state}/${params.city}`,
    title: `${service.name} in ${city}, ${state.abbreviation} | InsureDirect`,
    description: `Compare ${service.name.toLowerCase()} coverage options in ${city}, ${state.name}.`,
  });
}

export default function CityPage({ params }: { params: { state: string; city: string } }) {
  const service = getServiceBySlug(SERVICE_SLUG)!;
  const state = getStateBySlug(params.state);
  const city = state?.servedCities.find((c) => citySlugify(c) === params.city);
  if (!state || !city) notFound();
  return <CityPageTemplate service={service} state={state} city={city} />;
}
