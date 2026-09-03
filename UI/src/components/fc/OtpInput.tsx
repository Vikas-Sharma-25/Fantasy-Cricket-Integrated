import { useRef, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export function OtpInput({
  value = "",
  onChange,
  length = 6,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  function handleChange(e: ChangeEvent<HTMLInputElement>, index: number) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join("");
    onChange(newValue);

    // Auto-focus next input if a digit was entered
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous box on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
      {Array.from({ length }).map((_, i) => {
        const isFilled = Boolean(digits[i]);
        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            value={digits[i]}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className={`h-14 w-11 sm:h-16 sm:w-13 rounded-xl border text-center font-display text-2xl font-bold transition-all outline-none ${
              isFilled
                ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/10"
                : "border-border bg-surface text-muted-foreground hover:border-primary/50"
            } focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/40`}
          />
        );
      })}
    </div>
  );
}

