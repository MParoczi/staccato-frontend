import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SortOption = 'updatedAt' | 'createdAt' | 'title';

interface SortControlProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  const { t } = useTranslation();

  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="updatedAt">
          {t('notebooks.dashboard.sortLastUpdated')}
        </SelectItem>
        <SelectItem value="createdAt">
          {t('notebooks.dashboard.sortCreatedDate')}
        </SelectItem>
        <SelectItem value="title">
          {t('notebooks.dashboard.sortTitle')}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
