import type { BatchResult, MatchType } from "@/lib/types";
import { avatarUrl, initials } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const matchLabels: Record<NonNullable<MatchType>, string> = {
  exact_id: "ID",
  username: "Username",
  fuzzy: "Fuzzy",
};

type Props = {
  result: BatchResult;
  onCopyId: (id: string) => void;
  showReason: boolean;
};

export default function BatchResultCard({ result, onCopyId, showReason }: Props) {
  const { found, matchType } = result;

  return (
    <Card className="mx-[1px] flex-row items-center gap-2 p-2">
      <div
        className={cn(
          "size-2 shrink-0 rounded-full",
          found ? "bg-destructive" : "bg-green-500"
        )}
      />
      {found ? (
        <>
          <div className="size-6 shrink-0 overflow-hidden rounded-full bg-muted">
            {avatarUrl(found) ? (
              <img
                src={avatarUrl(found)}
                alt={found.user.username}
                className="size-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[10px] font-medium uppercase text-muted-foreground">
                {initials(found)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="truncate text-sm font-medium text-foreground">
                {found.user.global_name || found.user.username}
              </span>
              {found.user.global_name && (
                <span className="truncate text-xs text-muted-foreground">
                  @{found.user.username}
                </span>
              )}
              {matchType && matchType !== "exact_id" && (
                <span
                  className={cn(
                    "ml-auto shrink-0 rounded px-1 py-[1px] text-[10px] font-medium leading-none",
                    matchType === "fuzzy"
                      ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                      : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  )}
                >
                  {matchLabels[matchType]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => onCopyId(found.user.id)}
              >
                {found.user.id}
              </button>
              {showReason && found.reason && (
                <span className="max-w-48 truncate text-xs text-muted-foreground">
                  &middot; {found.reason}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <span className="px-1 text-xs font-medium text-muted-foreground">
            Not found
          </span>
          <code className="truncate text-xs text-foreground">
            {result.input}
          </code>
        </>
      )}
    </Card>
  );
}
