"use client";

import { useEffect } from "react";
import { useDashboardData } from "@/context/DashboardDataContext";

const DEFAULT_FAVICON_PATH = "/favicon.ico";
const DEFAULT_DOCUMENT_TITLE = "MIS NSDO";

export default function BrandingHead() {
  const { branding } = useDashboardData();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const targetHref = branding.faviconUrl ?? DEFAULT_FAVICON_PATH;
    let faviconLink = document.querySelector<HTMLLinkElement>("link[data-app-favicon]");

    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      faviconLink.setAttribute("data-app-favicon", "true");
      document.head.appendChild(faviconLink);
    }

    if (faviconLink.getAttribute("href") !== targetHref) {
      faviconLink.setAttribute("href", targetHref);
    }
  }, [branding.faviconUrl]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const trimmedName = branding.companyName?.trim();
    if (trimmedName) {
      document.title = `${trimmedName} Dashboard`;
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }
  }, [branding.companyName]);

  return null;
}
