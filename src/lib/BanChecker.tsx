import Fuse, { type IFuseOptions } from "fuse.js";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseList } from "@/lib/parsers";
import type { BanEntry, BatchResult } from "@/lib/types";
import BatchResultCard from "@/components/BatchResultCard";
import SearchResultCard from "@/components/SearchResultCard";

const ITEM_HEIGHT = 68;
const STORAGE_KEY = "bans-checker-data";
const REASON_KEY = "bans-checker-show-reasons";

const FUSE_OPTIONS: IFuseOptions<BanEntry> = {
  keys: [
    { name: "user.username", weight: 1 },
    { name: "user.global_name", weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
};

export default function BanChecker() {
  const [data, setData] = useState<BanEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && "user" in parsed[0])
          return parsed as BanEntry[];
      }
    } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);
  const [showReasons, setShowReasons] = useState(() =>
    localStorage.getItem(REASON_KEY) !== "false"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollParentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [data]);

  useEffect(() => {
    localStorage.setItem(REASON_KEY, String(showReasons));
  }, [showReasons]);

  const fuse = useMemo(() => new Fuse(data, FUSE_OPTIONS), [data]);

  const parsedItems = useMemo(() => parseList(input), [input]);
  const isBatch = parsedItems.length > 1;
  const hasBatchResults = batchResults !== null;

  const exactFiltered = useMemo(() => {
    if (!data.length || !input.trim() || isBatch) return data;
    const q = input.toLowerCase();
    return data.filter(
      (entry) =>
        entry.user.id.includes(q) ||
        entry.user.username.toLowerCase().includes(q) ||
        (entry.user.global_name ?? "").toLowerCase().includes(q)
    );
  }, [data, input, isBatch]);

  const fuzzyMatches = useMemo(() => {
    if (!data.length || input.trim().length < 2 || isBatch) return [];
    const q = input.trim();
    const exactIds = new Set(exactFiltered.map((e) => e.user.id));
    return fuse
      .search(q)
      .filter((r) => !exactIds.has(r.item.user.id))
      .map((r) => r.item);
  }, [data, input, isBatch, exactFiltered, fuse]);

  const fuzzyIdSet = useMemo(
    () => new Set(fuzzyMatches.map((e) => e.user.id)),
    [fuzzyMatches]
  );

  const displayItems = hasBatchResults
    ? batchResults!
    : isBatch
      ? []
      : [...exactFiltered, ...fuzzyMatches];
  const itemCount = displayItems.length;

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBatchResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          "user" in parsed[0]
        ) {
          setData(parsed as BanEntry[]);
        } else {
          setError("Expected an array of Discord ban entries");
        }
      } catch {
        setError("Failed to parse JSON");
      }
    };
    reader.readAsText(file);
  }, []);

  const runBatchCheck = useCallback(() => {
    if (parsedItems.length === 0) return;
    const results: BatchResult[] = parsedItems.map((item) => {
      if (item.id) {
        const found = data.find((e) => e.user.id === item.id);
        if (found) return { input: item.raw, found, matchType: "exact_id" };
      }
      if (item.username) {
        const q = item.username.toLowerCase();
        const exact = data.find(
          (e) =>
            e.user.username.toLowerCase() === q ||
            (e.user.global_name ?? "").toLowerCase() === q
        );
        if (exact) return { input: item.raw, found: exact, matchType: "username" };

        const fuzzy = fuse.search(item.username);
        if (fuzzy.length > 0) {
          return { input: item.raw, found: fuzzy[0].item, matchType: "fuzzy" };
        }
      }
      return { input: item.raw, found: null, matchType: null };
    });
    setBatchResults(results);
    virtualizer.scrollToIndex(0);
  }, [parsedItems, data, fuse, virtualizer]);

  const reset = useCallback(() => {
    setData([]);
    setInput("");
    setError(null);
    setBatchResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const copyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
  }, []);

  const clearBatch = useCallback(() => {
    setBatchResults(null);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 h-full">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
          <span className="mt-px shrink-0 font-medium text-destructive">Error:</span>
          <span className="flex-1 text-foreground">{error}</span>
          <button
            type="button"
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-foreground">Bans Checker</h1>
        {data.length > 0 && (
          <Badge variant="outline">{data.length} total</Badge>
        )}
      </div>

      {data.length === 0 ? (
        <Card className="flex flex-1 flex-col items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">Upload a Discord bans JSON file</p>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFile}
            className="max-w-64"
          />
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 border-b pb-2">
            <span className="truncate text-xs text-muted-foreground">
              {data.length} entries loaded
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowReasons((v) => !v)}
              >
                {showReasons ? "Hide reasons" : "Show reasons"}
              </button>
              <Button variant="ghost" size="sm" onClick={reset}>
                Close file
              </Button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (batchResults) setBatchResults(null);
            }}
            rows={isBatch || hasBatchResults ? 3 : 1}
            placeholder="Type a name or ID to search, or paste a delimited list for batch checking..."
            className="min-h-[36px] resize-y rounded-md border border-input bg-input/20 p-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
          />

          <div className="flex items-center gap-2">
            {isBatch && !hasBatchResults && (
              <Button onClick={runBatchCheck} size="sm">
                Check ({parsedItems.length} items)
              </Button>
            )}
            {hasBatchResults && (
              <>
                <Badge variant="outline">
                  {batchResults.filter((r) => r.found).length}/{batchResults.length} found
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearBatch}>
                  Back to search
                </Button>
              </>
            )}
            {!isBatch && !hasBatchResults && input.trim() && (
              <Badge variant="outline" className="shrink-0">
                {displayItems.length}/{data.length}
              </Badge>
            )}
          </div>

          {itemCount === 0 && input.trim() ? (
            <Card className="py-8">
              <p className="text-center text-sm text-muted-foreground">
                No results found
              </p>
            </Card>
          ) : itemCount === 0 ? null : (
            <div
              ref={scrollParentRef}
              className="overflow-y-auto flex-1 min-h-0"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const idx = virtualItem.index;

                  return (
                    <div
                      key={virtualItem.key}
                      data-index={idx}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {hasBatchResults ? (
                        <BatchResultCard
                          result={batchResults![idx]}
                          onCopyId={copyId}
                          showReason={showReasons}
                        />
                      ) : (
                        <SearchResultCard
                          entry={displayItems[idx] as BanEntry}
                          onCopyId={copyId}
                          showReason={showReasons}
                          fuzzy={fuzzyIdSet.has(
                            (displayItems[idx] as BanEntry).user.id
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
