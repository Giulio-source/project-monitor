import React, { useState } from "react";
import { invoke } from "@forge/bridge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function StorageDebugModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFetchStorageDebug = async () => {
    setIsLoading(true);
    try {
      const data = await invoke("getDebugStorage");
      setDebugData(data);
    } catch (err) {
      console.error("Failed to fetch storage debug info:", err);
      setDebugData({ error: "Failed to load storage data." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
          onClick={handleFetchStorageDebug}
        >
          Debug Storage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Forge Storage Inspector</DialogTitle>
          <DialogDescription>
            Current key-value pairs saved in this app instance's persistent
            storage.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Querying Forge storage...
            </div>
          ) : (
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-md overflow-x-auto max-h-[350px]">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleFetchStorageDebug}>
            Refresh Dump
          </Button>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
