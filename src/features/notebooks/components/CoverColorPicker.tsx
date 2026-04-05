import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { COVER_COLORS } from '@/lib/constants/notebook-colors';

const HEX_REGEX = /^#?[0-9a-fA-F]{6}$/;

interface CoverColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function CoverColorPicker({ value, onChange }: CoverColorPickerProps) {
  const { t } = useTranslation();
  const [customHex, setCustomHex] = useState('');
  const [hexError, setHexError] = useState('');

  function handleCustomHexChange(input: string) {
    setCustomHex(input);
    setHexError('');

    if (input.length === 0) return;

    if (HEX_REGEX.test(input)) {
      const normalized = input.startsWith('#') ? input : `#${input}`;
      onChange(normalized);
      setHexError('');
    } else if (input.length >= 6) {
      setHexError(t('notebooks.create.invalidHex'));
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">
        {t('notebooks.create.coverColorLabel')}
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <span
              className="inline-block size-5 rounded-full ring-1 ring-foreground/20"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid grid-cols-4 gap-2">
            {COVER_COLORS.map((color) => {
              const isSelected = value.toLowerCase() === color.hex.toLowerCase();
              return (
                <button
                  key={color.hex}
                  type="button"
                  aria-label={t(color.labelKey)}
                  className={cn(
                    'flex size-11 items-center justify-center rounded-full transition-all',
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1 hover:ring-offset-background',
                  )}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => {
                    onChange(color.hex);
                    setCustomHex('');
                    setHexError('');
                  }}
                >
                  {isSelected && (
                    <Check className="size-4 text-white drop-shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-1">
            <Input
              placeholder={t('notebooks.create.customHex')}
              value={customHex}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              aria-invalid={hexError ? true : undefined}
            />
            {hexError && (
              <p className="text-xs text-destructive">{hexError}</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
