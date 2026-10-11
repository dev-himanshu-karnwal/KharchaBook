"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StateBlock } from "@/components/v2/state-block";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="surface-panel">
      <StateBlock
        kind="error"
        title="This page couldn’t load"
        description="Something went wrong while fetching your data. Your records are safe — try again."
        onRetry={() => {
          router.refresh();
          reset();
        }}
      />
    </div>
  );
}
