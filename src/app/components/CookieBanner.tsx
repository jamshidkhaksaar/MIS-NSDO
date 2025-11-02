"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent !== "true") {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("cookie_consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 p-4 backdrop-blur-md border-t border-brand">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <p className="text-sm text-brand-muted">
          We use cookies to ensure you get the best experience on our website. By continuing to use
          this site, you agree to our use of cookies.
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white btn-brand"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
