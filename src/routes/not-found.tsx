import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/app/notebooks" className="text-primary underline">
        Back to notebooks
      </Link>
    </div>
  );
}
