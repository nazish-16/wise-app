import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] mb-2">
            Welcome Back
          </h1>
          <p className="text-[rgb(var(--muted-foreground))]">
            Sign in to continue to your Wise dashboard
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[rgb(var(--card))] border border-[rgb(var(--border))] shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}
