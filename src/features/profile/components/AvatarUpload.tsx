import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Camera, Check, Loader2, Trash2, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUploadAvatar, useDeleteAvatar } from '../hooks/useAvatarUpload';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface AvatarUploadProps {
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

export function AvatarUpload({
  avatarUrl,
  firstName,
  lastName,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const uploadMutation = useUploadAvatar();
  const deleteMutation = useDeleteAvatar();

  const hasCustomAvatar = avatarUrl !== null && !imgError;
  const hasNames = firstName.length > 0 || lastName.length > 0;
  const initials = getInitials(firstName, lastName);
  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isPreviewing = previewUrl !== null;

  const displayUrl = previewUrl ?? (imgError ? null : avatarUrl);

  const revokePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
  }, [previewUrl]);

  const handleAvatarClick = () => {
    if (isPreviewing || isUploading || isDeleting) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t('profile.errors.avatarInvalid'));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('profile.errors.avatarTooLarge'));
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  const handleConfirm = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile, {
      onSettled: () => {
        revokePreview();
      },
    });
  };

  const handleCancel = () => {
    revokePreview();
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(undefined, {
      onSettled: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative">
        <button
          type="button"
          className="group relative size-24 shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleAvatarClick}
          disabled={isPreviewing || isUploading || isDeleting}
          aria-label={t('profile.avatar.upload')}
        >
          <div className="size-24 overflow-hidden rounded-full bg-muted">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt={`${firstName} ${lastName}`}
                className="size-full object-cover"
                onError={() => {
                  if (!previewUrl) setImgError(true);
                }}
              />
            ) : hasNames ? (
              <div className="flex size-full items-center justify-center bg-primary/10 text-xl font-semibold text-primary">
                {initials}
              </div>
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <User className="size-10" aria-hidden="true" />
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2
                  className="size-8 animate-spin text-white"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>

          {!isPreviewing && !isUploading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/30">
              <Camera
                className="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            </div>
          )}
        </button>

        {hasCustomAvatar && !isPreviewing && !isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            className="absolute -right-1 -bottom-1 rounded-full"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            aria-label={t('profile.avatar.delete')}
          >
            <Trash2 className="size-3" aria-hidden="true" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {isPreviewing && !isUploading && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
          >
            <Check className="size-3.5" aria-hidden="true" />
            {t('profile.avatar.confirm')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <X className="size-3.5" aria-hidden="true" />
            {t('profile.avatar.cancel')}
          </Button>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('profile.avatar.deleteConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.avatar.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              {isDeleting && (
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
