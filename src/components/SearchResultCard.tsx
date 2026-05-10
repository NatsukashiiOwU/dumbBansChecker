import type { BanEntry } from "@/lib/types";
import { avatarUrl, initials } from "@/lib/helpers";
import { Card } from "@/components/ui/card";

type Props = {
  entry: BanEntry;
  onCopyId: (id: string) => void;
  showReason: boolean;
  fuzzy?: boolean;
};

export default function SearchResultCard({ entry, onCopyId, showReason, fuzzy }: Props) {
  return (
    <Card className="mx-[1px] flex-row items-center gap-3 p-2">
      <div className="size-6 shrink-0 overflow-hidden rounded-full bg-muted">
        {entry.user.avatar ? (
          <img
            src={avatarUrl(entry)}
            alt={entry.user.username}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] font-medium uppercase text-muted-foreground">
            {initials(entry)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="truncate text-sm font-medium text-foreground">
                {entry.user.global_name || entry.user.username}
              </span>
              {entry.user.global_name &&
                entry.user.global_name !== entry.user.username && (
                  <span className="truncate text-xs text-muted-foreground">
                    @{entry.user.username}
                  </span>
                )}
              {fuzzy && (
                <span className="ml-auto shrink-0 rounded bg-yellow-500/15 px-1 py-[1px] text-[10px] font-medium leading-none text-yellow-600 dark:text-yellow-400">
                  Fuzzy
                </span>
              )}
            </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onCopyId(entry.user.id)}
          >
            {entry.user.id}
          </button>
          {showReason && entry.reason && (
            <span className="max-w-64 truncate text-xs text-muted-foreground">
              &middot; {entry.reason}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
