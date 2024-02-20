"use client";
import { ErrorPanel } from "@clientComponents/globals";
import { logMessage } from "@lib/logger";
import { useEffect } from "react";

// TODO: design and content

// NOTE: automatically sets an ErrorBoundary around the nearest Page.tsx
// NOTE: must be a default export
// NOTE: the thrown error is passed to this component
export default function Error({
  error,
}: // reset,
{
  error: Error & { digest?: string };
  // reset: () => void
}) {
  useEffect(() => {
    logMessage.error(`Client Error: ${error.message}`);
  }, [error]);

  return (
    <>
      <ErrorPanel
        title="Sorry, something went wrong in the Administration section."
        supportLink={false}
      >
        <>
          {error.message && <p className="mb-5"></p>}
          {/* <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            Try again
          </Button> */}
        </>
      </ErrorPanel>
    </>
  );
}
