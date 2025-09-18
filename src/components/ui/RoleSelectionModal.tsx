import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RoleSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectRole: (role: string) => void;
}

const roles = [
  { label: "Mother", value: "mother" },
  { label: "Nurse", value: "nurse" },
  { label: "CHW", value: "chw" },
];

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ open, onClose, onSelectRole }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle>Select Registration Role</DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-4 mt-2">
          {roles.map((role) => (
            <Button
              key={role.value}
              onClick={() => onSelectRole(role.value)}
              className="w-full"
              variant="outline"
            >
              Register as {role.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
