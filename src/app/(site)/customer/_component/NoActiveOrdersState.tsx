"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PackageSearch, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getRecentTrackingNumbers,
  saveTrackingNumber,
} from "@/components/helper/trackingHistory";
import { QrCode } from "lucide-react";
import { TrackingQRScanner } from "./TrackingQRScanner";

export function NoActiveOrdersState({
  onSearch,
}: {
  onSearch: (trackingNumber: string) => void;
}) {
  const [value, setValue] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    setRecent(getRecentTrackingNumbers());
  }, []);

  const submit = (tracking?: string) => {
    const tn = (tracking ?? value).trim();
    if (!tn) return;

    saveTrackingNumber(tn);
    onSearch(tn);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <PackageSearch className="w-12 h-12 text-gray-400" />

      <div>
        <p className="text-lg font-medium">No active orders</p>
        <p className="text-sm text-gray-500 mt-1">
          Track an order using your tracking number.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter tracking number"
            className="pr-12"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />

          <Button
            variant="ghost"
            disabled={!value.trim()}
            onClick={() => submit()}
            className="absolute top-1/2 right-1 -translate-y-1/2"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowScanner(true)}
        >
          <QrCode className="w-4 h-4 mr-2" />
          Scan tracking QR
        </Button>

        {showScanner && (
          <TrackingQRScanner
            onResult={(tracking) => {
              saveTrackingNumber(tracking);
              onSearch(tracking);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* RECENT SEARCHES */}
        {recent.length > 0 && (
          <div className="text-left border rounded-lg p-3 bg-white dark:bg-background">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Recent searches
            </p>

            <div className="flex flex-wrap gap-2">
              {recent.map((t) => (
                <button
                  key={t}
                  onClick={() => submit(t)}
                  className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
