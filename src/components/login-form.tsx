"use client";

import { useState } from "react";
import { MailCheck, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { localePath, type Lang } from "@/lib/i18n";

type State = "idle" | "sending" | "sent" | "error";

export function LoginForm({ lang }: { lang: Lang }) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    if (typeof email !== "string" || !email) return;

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setState("error");
      setMessage("Supabase no está configurado en este entorno.");
      return;
    }

    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
          localePath(lang, "/admin"),
        )}`,
      },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <Alert className="border-ok/40 bg-ok-muted text-ok-foreground">
        <MailCheck className="size-4" aria-hidden />
        <AlertTitle>Revisa tu correo</AlertTitle>
        <AlertDescription className="text-ok-foreground/80">
          Te enviamos un enlace de acceso. Ábrelo en este mismo dispositivo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state === "error" && message ? (
        <Alert className="border-down/40 bg-down-muted text-down-foreground">
          <TriangleAlert className="size-4" aria-hidden />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Correo institucional</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nombre@organizacion.gov.co"
        />
      </div>

      <Button type="submit" className="w-full" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Enviar enlace de acceso"}
      </Button>
    </form>
  );
}
