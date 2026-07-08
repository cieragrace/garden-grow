"use client";

/**
 * RememberZone — invisible client sliver of the server-rendered results page.
 * Persists the resolved zone as the user's "home base" (Nav chip, hero entry,
 * garden hub) without pulling the plant grid into the client bundle.
 */

import { useEffect } from "react";
import { setLastZone } from "@/lib/lastZone";

export default function RememberZone({
  zip,
  zone,
}: {
  zip: string;
  zone: number;
}) {
  useEffect(() => {
    setLastZone({ zip, zone });
  }, [zip, zone]);

  return null;
}
