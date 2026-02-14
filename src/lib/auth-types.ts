// ============================================================
// Extended Auth.js types for TAVERNA
// ============================================================
import 'next-auth';
import '@auth/core/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      displayName?: string;
    };
  }

  interface User {
    role?: string;
    displayName?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    displayName?: string;
  }
}
