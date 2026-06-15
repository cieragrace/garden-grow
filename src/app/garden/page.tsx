import type { Metadata } from "next";
import GardenHub from "./GardenHub";

export const metadata: Metadata = {
  title: "My Garden",
  description:
    "Your garden planning hub — saved plants, companion-planting checks, and a to-scale bed designer.",
};

export default function GardenPage() {
  return <GardenHub />;
}
