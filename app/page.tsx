import { redirect } from "next/navigation";

// Root "/" redirects to the dashboard (protected by Clerk middleware)
export default function RootPage() {
  redirect("/dashboard");
}
