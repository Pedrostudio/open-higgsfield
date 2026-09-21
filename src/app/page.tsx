import type { Metadata } from "next";

import { studioFont } from "@/openhiggsfield/font";
import { OpenHiggsfieldApp } from "@/openhiggsfield/openhiggsfield-app";

import "@/openhiggsfield/openhiggsfield.css";

/* Title, description and the Open Graph block all come from the root, which
   already describes this surface. Only the canonical link is route-specific. */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function StudioPage() {
  return <OpenHiggsfieldApp fontClassName={studioFont.variable} />;
}
