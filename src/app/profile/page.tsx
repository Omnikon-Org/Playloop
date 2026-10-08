"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Current user is rishi
    router.replace('/profile/rishi');
  }, [router]);
  return null;
}
