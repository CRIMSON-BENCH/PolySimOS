import { SignUp } from "@clerk/nextjs";

const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function Page() {
  if (!clerkConfigured) {
    return <div className="mx-auto max-w-md px-4 py-24 text-center text-slate-500">Sign-up activates once authentication keys are added.</div>;
  }
  return (
    <div className="flex justify-center px-4 py-16">
      <SignUp />
    </div>
  );
}
