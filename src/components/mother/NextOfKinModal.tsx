import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { NextOfKinSection } from "./NextOfKinSection";
import { Button } from "@/components/ui/button";

interface NextOfKinModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (kin: any[]) => void;
}

export function NextOfKinModal({ open, onClose, onSave }: NextOfKinModalProps) {
  const [nextOfKin, setNextOfKin] = useState([
    { name: '', phone: '', sex: '', relationship: '' },
    { name: '', phone: '', sex: '', relationship: '' },
  ]);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!nextOfKin[0].name || !nextOfKin[0].phone || !nextOfKin[0].sex || !nextOfKin[0].relationship) {
      setError('Please fill all required fields for the first Next of Kin.');
      return;
    }
    setError('');
    onSave(nextOfKin);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => v ? undefined : onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Next of Kin Details</DialogTitle>
          <DialogDescription>
            Please provide details for at least one next of kin to complete your registration.
          </DialogDescription>
        </DialogHeader>
        <NextOfKinSection kin={nextOfKin} isEditing={true} onChange={setNextOfKin} />
        {error && <div className="text-destructive text-sm font-medium mt-2">{error}</div>}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
