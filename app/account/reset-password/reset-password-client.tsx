"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [requestEmail, setRequestEmail] = useState("");
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRequestingReset) {
      return;
    }

    setRequestError(null);
    setRequestMessage(null);
    setIsRequestingReset(true);

    try {
      const response = await fetch("/api/account/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: requestEmail }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setRequestError(payload.error || "Could not create reset request.");
        return;
      }

      setRequestMessage(payload.message || "If an account exists, reset instructions have been prepared.");
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isResettingPassword) {
      return;
    }

    setResetError(null);
    setResetMessage(null);
    setIsResettingPassword(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setResetError("Passwords do not match.");
      setIsResettingPassword(false);
      return;
    }

    try {
      const response = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setResetError(payload.error || "Could not reset password.");
        return;
      }

      setResetMessage("Password reset. You are now signed in.");
      startTransition(() => {
        router.push("/account");
        router.refresh();
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!token) {
    return (
      <section className="mx-auto w-full max-w-xl border border-black bg-white p-6 sm:p-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-black">Reset password</h1>
          <p className="text-black/72">Enter your account email and we&apos;ll prepare a password reset link.</p>
        </div>
        <form onSubmit={(event) => void handleRequestReset(event)} className="mt-6 space-y-4">
          <input
            type="email"
            autoComplete="email"
            value={requestEmail}
            onChange={(event) => setRequestEmail(event.target.value)}
            placeholder="Email"
            className="w-full border border-black px-4 py-3 outline-none"
          />
          {requestError ? <p className="text-sm text-red-700">{requestError}</p> : null}
          {requestMessage ? <p className="text-sm text-black/72">{requestMessage}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending || isRequestingReset}
              className="border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black disabled:opacity-60"
            >
              {isRequestingReset ? "Sending..." : "Send reset link"}
            </button>
            <Link href="/account" className="text-sm underline underline-offset-4">
              Back to account
            </Link>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl border border-black bg-white p-6 sm:p-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-black">Choose a new password</h1>
        <p className="text-black/72">Enter your new password below.</p>
      </div>
      <form onSubmit={(event) => void handleResetPassword(event)} className="mt-6 space-y-4">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          className="w-full border border-black px-4 py-3 outline-none"
        />
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          className="w-full border border-black px-4 py-3 outline-none"
        />
        {resetError ? <p className="text-sm text-red-700">{resetError}</p> : null}
        {resetMessage ? <p className="text-sm text-black/72">{resetMessage}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending || isResettingPassword}
            className="border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black disabled:opacity-60"
          >
            {isResettingPassword ? "Resetting..." : "Reset password"}
          </button>
          <Link href="/account" className="text-sm underline underline-offset-4">
            Back to account
          </Link>
        </div>
      </form>
    </section>
  );
}
