import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, UserCheck } from 'lucide-react';
import React from 'react';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (role: 'mother' | 'chw') => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose, onSelect }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md animate-fade-in-out my-4 sm:my-0">
        <DialogHeader>
          <DialogTitle className="text-center">Register As</DialogTitle>
          <DialogDescription className="text-center">
            Choose your registration type
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-3">
          <Button
            onClick={() => onSelect('mother')}
            variant="outline"
            className="w-full h-auto min-h-20 p-4 flex items-start justify-start gap-3 text-left hover:bg-primary/5"
          >
            <div className="mt-0.5 rounded-full bg-accent/10 p-2">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="font-semibold leading-tight">Mother</div>
              <div className="text-sm text-muted-foreground">Register as a pregnant mother</div>
            </div>
          </Button>
          <Button
            onClick={() => onSelect('chw')}
            variant="outline"
            className="w-full h-auto min-h-20 p-4 flex items-start justify-start gap-3 text-left hover:bg-primary/5"
          >
            <div className="mt-0.5 rounded-full bg-primary/10 p-2">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold leading-tight">Community Health Worker</div>
              <div className="text-sm text-muted-foreground">Support and educate mothers</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
