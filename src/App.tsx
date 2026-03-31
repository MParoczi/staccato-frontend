import { RouterProvider } from 'react-router';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from '@/components/ui/sonner';
import { router } from '@/routes';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const content = (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}

export default App;
