import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  name: string;
  label: string;
  required?: boolean;
  visuallyHiddenLabel?: boolean;
  length?: number;
}

export function PinInput({
  value,
  onChange,
  name,
  label,
  required,
  visuallyHiddenLabel = true,
  length = 4,
}: PinInputProps) {
  const normalizedValue = useMemo(
    () => (value || '').replace(/\D/g, '').slice(0, length),
    [value, length]
  );

  const handleChange = (nextValue: string) => {
    onChange(nextValue.replace(/\D/g, '').slice(0, length));
  };

  return (
    <div className="w-full">
      <label
        htmlFor={`${name}-0`}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          visuallyHiddenLabel ? 'sr-only' : ''
        )}
      >
        {label}
      </label>

      <InputOTP
        maxLength={length}
        value={normalizedValue}
        onChange={handleChange}
        autoComplete="one-time-code"
        containerClassName="justify-center"
      >
        <InputOTPGroup className="gap-2">
          {Array.from({ length }).map((_, index) => (
            <InputOTPSlot
              key={`${name}-slot-${index}`}
              index={index}
              className="!h-11 sm:!h-12 !w-11 sm:!w-12 !rounded-lg !border !border-input !bg-background !text-base sm:!text-lg !font-semibold !shadow-sm"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      {/* Hidden input for form submission */}
      <input
        id={`${name}-0`}
        type="hidden"
        name={name}
        value={normalizedValue}
        required={required}
      />
    </div>
  );
}
