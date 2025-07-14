import { authClient } from "@/lib/auth-client";

export const handleSocialAuth = async (
  provider: "google" | "github",
  setError: (error: string | undefined) => void,
  setPending: (pending: boolean) => void,
) => {
  setError(undefined);
  setPending(true);
  try {
    const { error } = await authClient.signIn.social(
      {
        provider: provider,
        callbackURL: "/",
      },
      {
        onSuccess: () => {},
      },
    );
    if (error) {
      setError(error.message);
    }
  } finally {
    setPending(false);
  }
};
