import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  name: string;
  label: string;
  required?: boolean;
  visuallyHiddenLabel?: boolean;
}

export function PinInput({ value, onChange, name, label, required, visuallyHiddenLabel }: PinInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of 4 digits
  const values = [0, 1, 2, 3].map((i) => value[i] || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    let val = e.target.value.replace(/\D/g, '');

    if (val.length > 1) {
        // Paste or multiple chars
        const chars = val.split('').slice(0, 4);
        onChange(chars.join(''));

        // Focus last input
        if (inputsRef.current[3]) {
             inputsRef.current[3]?.focus();
        }
        return;
    }

    const newValues = [...values];
    newValues[idx] = val;
    onChange(newValues.join(''));

    if (val && idx < 3) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !values[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, 4);
    if (paste.length > 0) {
      onChange(paste);
      if (inputsRef.current[3]) {
          inputsRef.current[3]?.focus();
      }
    }
  };

  return (
    <div>
      <label htmlFor={`${name}-0`} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", visuallyHiddenLabel ? 'sr-only' : '')}>
        {label}
      </label>
      <div className="flex space-x-2 justify-center">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            id={`${name}-${i}`}
            name={`${name}-${i}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="off"
            aria-label={`${label} digit ${i + 1}`}
            className="flex h-12 w-12 rounded-md border border-input bg-background px-3 py-2 text-center text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={values[i]}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            required={required && i === 0}
          />
        ))}
      </div>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={values.join('')} />
    </div>
  );
}
