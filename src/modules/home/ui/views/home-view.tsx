"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const HomeView = () => {
  const { data: session } = authClient.useSession();

  if (!session) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-4 flex flex-col gap-y-4">
      <p>Logged in as {session?.user.name}</p>
      <Button onClick={() => authClient.signOut()}>Sign out</Button>
    </div>
  );
};
