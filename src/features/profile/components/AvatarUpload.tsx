import { useState } from 'react';
import { User, Camera } from 'lucide-react';

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
  const [imgError, setImgError] = useState(false);

  const hasImage = avatarUrl && !imgError;
  const hasNames = firstName.length > 0 || lastName.length > 0;
  const initials = getInitials(firstName, lastName);

  return (
    <div className="group relative size-24 shrink-0">
      <div className="size-24 overflow-hidden rounded-full bg-muted">
        {hasImage ? (
          <img
            src={avatarUrl}
            alt={`${firstName} ${lastName}`}
            className="size-full object-cover"
            onError={() => setImgError(true)}
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
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/30">
        <Camera
          className="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
