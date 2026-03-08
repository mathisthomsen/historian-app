"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  label: string;
}

export function LogoutButton({ label }: LogoutButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
    >
      {label}
    </Button>
  );
}
