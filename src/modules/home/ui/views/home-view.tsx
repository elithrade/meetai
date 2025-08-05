"use client";

import { LoadingState } from "@/components/loading-state";

export const HomeView = () => {
  return (
    <LoadingState
      title="Redirecting..."
      description="Please wait while we redirect you to the meetings page."
    />
  );
};
