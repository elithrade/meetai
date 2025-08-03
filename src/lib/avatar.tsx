import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials } from "@dicebear/collection";

type Props = {
  seed: string;
  variant?: "bottts-neutral" | "initials";
};

export const generateAvatarUri = ({
  seed,
  variant = "bottts-neutral",
}: Props) => {
  let avatar;

  if (variant === "bottts-neutral") {
    avatar = createAvatar(botttsNeutral, { seed });
  } else {
    avatar = createAvatar(initials, { seed, fontWeight: 500, fontSize: 42 });
  }

  return avatar.toDataUri();
};
