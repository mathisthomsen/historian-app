"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast("Default toast message")}>Show Toast</Button>
      <Button variant="outline" onClick={() => toast.success("Operation successful!")}>
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.error("Something went wrong.")}
      >
        Error
      </Button>
    </div>
  );
}
