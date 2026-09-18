import React, { useState } from "react";
import { Button } from "./ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface ClearPropertiesModalProps {
  onClearAll: () => Promise<boolean>;
  disabled?: boolean;
}

export function ClearPropertiesModal({
  onClearAll,
  disabled,
}: ClearPropertiesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    await onClearAll();
    setIsClearing(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-700 border-red-300 bg-red-50 hover:bg-red-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear All Properties
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Clear All Custom Properties?
          </DialogTitle>
          <DialogDescription className="text-xs pt-2">
            This action will permanently delete all custom column property
            values across <strong>all Jira projects</strong> in this workspace.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isClearing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleClear}
            disabled={isClearing || disabled}
          >
            {isClearing ? "Clearing..." : "Yes, Delete All Properties"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
