'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCampaignRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to dashboard where the create modal lives
    router.replace('/dashboard');
  }, [router]);
  return null;
}
