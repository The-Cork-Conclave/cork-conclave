"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { celebratePaymentSuccess } from "@/lib/celebrate-payment-success";

export function PaymentSuccessCelebration() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (searchParams.get("success") !== "true") return;
    if (handled.current) return;
    handled.current = true;
    celebratePaymentSuccess("You're registered — payment received. Check your email for your ticket.");
    router.replace("/event");
  }, [router, searchParams]);

  return null;
}
