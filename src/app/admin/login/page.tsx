import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Ingreso de moderadores",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Ingreso de moderadores
        </h1>
        <p className="text-sm text-muted-foreground">
          Te enviamos un enlace de acceso al correo. No usamos contraseñas.
        </p>
      </header>
      <LoginForm />
    </div>
  );
}
