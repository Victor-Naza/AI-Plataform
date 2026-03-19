import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel: string;
  wrapperClassName?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
}

function mergeClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = 'Selecionar',
  disabled = false,
  ariaLabel,
  wrapperClassName,
  triggerClassName,
  menuClassName,
  optionClassName,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={mergeClasses('relative', wrapperClassName)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={mergeClasses(
          'flex w-full items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface px-4 py-3 text-left text-sm text-app-text outline-none transition-colors hover:border-brand/50 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50',
          triggerClassName
        )}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-app-muted transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && options.length > 0 && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={mergeClasses(
            'absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-app-border bg-app-surface p-2 shadow-2xl shadow-black/30',
            menuClassName
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <button
                key={`${option.value || '__empty__'}-${index}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => {
                  if (!option.disabled) {
                    handleSelect(option.value);
                  }
                }}
                className={mergeClasses(
                  `flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-brand/15 text-brand'
                      : 'text-app-text hover:bg-app-bg'
                  } disabled:cursor-not-allowed disabled:opacity-50`,
                  optionClassName
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
