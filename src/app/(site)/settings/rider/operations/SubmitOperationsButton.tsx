"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type SubmitOperationsButtonProps = {
  disabled?: boolean;
};

export default function SubmitOperationsButton({
  disabled = false,
}: SubmitOperationsButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? (
        <>
          <Spinner className="size-4" />
          Saving...
        </>
      ) : (
        "Save Operations"
      )}
    </Button>
  );
}
