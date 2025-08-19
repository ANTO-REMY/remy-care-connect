import { useRef } from 'react';

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  name: string;
  label: string;
  required?: boolean;
  visuallyHiddenLabel?: boolean;
}

export function PinInput({ value, onChange, name, label, required, visuallyHiddenLabel }: PinInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Split value into array of 4 digits
  const values = [0, 1, 2, 3].map((i) => value[i] || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 1) {
      // Handle paste
      const chars = val.split('').slice(0, 4);
      onChange(chars.join(''));
      setTimeout(() => {
        if (inputsRef.current[chars.length - 1]) {
          inputsRef.current[chars.length - 1]?.focus();
        }
      }, 0);
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
    const paste = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, 4);
    if (paste.length > 0) {
      onChange(paste);
      setTimeout(() => {
        if (inputsRef.current[paste.length - 1]) {
          inputsRef.current[paste.length - 1]?.focus();
        }
      }, 0);
    }
    e.preventDefault();
  };

  return (
    <div>
      <label htmlFor={`${name}-0`} className={visuallyHiddenLabel ? 'sr-only' : ''}>
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
            className="rounded-md border bg-background h-12 w-12 text-center text-lg focus:ring-2 focus:ring-primary focus:outline-none"
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
