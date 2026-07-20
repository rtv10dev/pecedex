"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-ink">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contraseña secreta"
          disabled={pending}
          className="w-full rounded-2xl border-2 border-coral/20 bg-foam-white px-4 py-3 text-ink placeholder:text-mist focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/30 disabled:opacity-60"
          required
        />
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-medium text-coral"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-gradient-to-r from-coral via-anemone to-tang px-4 py-3.5 font-bold text-white shadow-lg shadow-coral/30 transition active:scale-[0.99] disabled:opacity-70"
      >
        {pending ? "Comprobando…" : "Entrar al arrecife"}
      </button>
    </form>
  );
}
