"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StudyCreationForm } from "./study-creation-form";

interface StudyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStudy: (study: any) => void;
  buckets: any[];
  users: any[];
}

export function StudyCreationModal({
  isOpen,
  onClose,
  onCreateStudy,
  buckets,
  users,
}: StudyCreationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a new research study to your lab</DialogTitle>
        </DialogHeader>
        <StudyCreationForm
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={(data) => {
            onCreateStudy(data);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}