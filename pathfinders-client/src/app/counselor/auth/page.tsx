'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/counselor-access');
  }, [router]);

  return (
    <div className="min-h-screen flex justify-center items-center">
      <p>Redirecting to new counselor access page...</p>
    </div>
  );
} 