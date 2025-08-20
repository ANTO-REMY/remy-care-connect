import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface VerifyOTPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void; // Called after fade-out
  onSubmit: (otp: string) => Promise<boolean>; // Return true on success, false/throw on error
  onResend: () => Promise<void> | void;
  phoneNumber?: string;
}

export function VerifyOTPModal({ open, onOpenChange, onVerified, onSubmit, onResend, phoneNumber }: VerifyOTPModalProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isComplete = useMemo(() => /^\d{5}$/.test(otp), [otp]);

  useEffect(() => {
    if (!open) {
      // reset when closing
      setOtp('');
      setIsVerifying(false);
      setIsResending(false);
      setError(null);
    }
  }, [open]);

  const handleVerify = async () => {
    setError(null);
    if (!isComplete) {
      setError('Please enter the 5-digit code.');
      return;
    }
    try {
      setIsVerifying(true);
      const ok = await onSubmit(otp);
      if (ok) {
        // brief success state then close and redirect after fade-out
        onOpenChange(false);
        setTimeout(() => {
          onVerified();
        }, 220);
      } else {
        setError('Invalid or expired code.');
      }
    } catch (e) {
      setError('Invalid or expired code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      await onResend();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Verify Your Phone</DialogTitle>
          <DialogDescription className="text-center">
            Enter the 5-digit code sent to {phoneNumber ? <span className="font-medium">{phoneNumber}</span> : 'your phone'}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <InputOTP maxLength={5} value={otp} onChange={(value) => setOtp(value.replace(/\D/g, '').slice(0, 5))}>
            <InputOTPGroup>
              {[0,1,2,3,4].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Didn’t receive a code? You can resend it.</p>
          )}

          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="outline" className="w-1/2" onClick={handleResend} disabled={isResending || isVerifying}>
              {isResending ? 'Resending…' : 'Resend'}
            </Button>
            <Button className="w-1/2" onClick={handleVerify} disabled={!isComplete || isVerifying}>
              {isVerifying ? 'Verifying…' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VerifyOTPModal;





