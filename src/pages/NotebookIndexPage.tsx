import { useTranslation } from 'react-i18next'

export default function NotebookIndexPage() {
  const { t } = useTranslation('notebooks')

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-medium">{t('book.indexEmpty')}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t('book.indexEmptyHint')}</p>
    </div>
  )
}
