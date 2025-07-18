import { GeneratedAvatar } from "@/components/generated-avatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import { ReactElement } from "react";
import { useRouter } from "next/navigation";

export const DashboardUserButton = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  const renderDropdownMenuItem = (
    text: string,
    icon: ReactElement,
    onClickHandler: () => void,
  ) => {
    return (
      <DropdownMenuItem
        className="cursor-pointer flex items-center justify-between"
        onClick={onClickHandler}
      >
        {text}
        {icon}
      </DropdownMenuItem>
    );
  };

  const onLogout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };

  if (isPending || !data?.user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden">
        {data.user.image ? (
          <Avatar className="size-9 mr-3">
            <AvatarImage
              src={data.user.image}
              alt={data.user.name || "User Avatar"}
            />
          </Avatar>
        ) : (
          <GeneratedAvatar
            seed={data.user.name || "User"}
            className="size-9 mr-3"
            variant="initials"
          />
        )}
        <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
          <p className="text-sm truncate w-full">{data.user.name}</p>
          <p className="text-xs truncate w-full">{data.user.email}</p>
        </div>
        <ChevronDownIcon className="size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium truncate">{data.user.name}</span>
            <span className="text-sm font-normal text-muted-foreground truncate">
              {data.user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {renderDropdownMenuItem(
          "Billing",
          <CreditCardIcon className="size-4" />,
          () => {},
        )}
        {renderDropdownMenuItem(
          "Logout",
          <LogOutIcon className="size-4" />,
          onLogout,
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
