import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require a signed-in user. Everything else stays public.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const clerkConfigured = !!process.env.CLERK_SECRET_KEY;

// Conditional export: with no CLERK_SECRET_KEY, middleware is a no-op so the app
// builds and runs without Clerk keys. Add the keys in Vercel + redeploy to
// activate — no code change needed.
export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) await auth.protect();
    })
  : function noopMiddleware() {};

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
