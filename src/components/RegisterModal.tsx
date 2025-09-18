import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, UserCheck, Stethoscope } from 'lucide-react';
import React from 'react';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (role: 'mother' | 'chw' | 'nurse') => void;
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
        <div className="space-y-4 mt-4">
          <Button
            onClick={() => onSelect('mother')}
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:bg-primary/5"
          >
            <User className="h-8 w-8 text-accent" />
            <div className="text-center">
              <div className="font-semibold">Mother</div>
              <div className="text-sm text-muted-foreground">Register as a pregnant mother</div>
            </div>
          </Button>
          <Button
            onClick={() => onSelect('chw')}
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:bg-primary/5"
          >
            <UserCheck className="h-8 w-8 text-primary" />
            <div className="text-center">
              <div className="font-semibold">Community Health Worker</div>
              <div className="text-sm text-muted-foreground">Support and educate mothers</div>
            </div>
          </Button>
          <Button
            onClick={() => onSelect('nurse')}
            variant="outline"
            className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:bg-primary/5"
          >
            <Stethoscope className="h-8 w-8 text-secondary" />
            <div className="text-center">
              <div className="font-semibold">Nurse</div>
              <div className="text-sm text-muted-foreground">Provide clinical oversight and guidance</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
