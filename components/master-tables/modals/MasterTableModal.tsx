"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MasterTableModalSize = "sm" | "md" | "lg";

interface MasterTableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  size?: MasterTableModalSize;
}

const sizeClasses: Record<MasterTableModalSize, string> = {
  sm: "max-w-[90vw] sm:max-w-[500px]",
  md: "max-w-[90vw] sm:max-w-[700px]",
  lg: "max-w-[85vw] sm:max-w-[800px]",
};

export const MasterTableModal: React.FC<MasterTableModalProps> = ({
  open,
  onOpenChange,
  title,
  children,
  size = "md",
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto grid-cols-1",
          sizeClasses[size]
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0">{children}</div>
      </DialogContent>
    </Dialog>
  );
};
