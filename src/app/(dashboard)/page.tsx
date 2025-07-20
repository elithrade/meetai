import { auth } from "@/lib/auth";
import { HomeView } from "@/modules/home/ui/views/home-view";
import { caller } from "@/trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
  // Deconstruction of the header params
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const data = await caller.hello({ text: session.user.name || "Guest" });

  return (
    <>
      {session.user.name ? `Welcome, ${session.user.name}` : "Dashboard"}
      <p>{data.greeting}</p>
      <HomeView />
    </>
  );
};

export default Page;
