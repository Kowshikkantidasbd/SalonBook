import { Suspense } from 'react';
import { BrowseServicesClient } from '@/components/BrowseServicesClient';
import { SalonLoader } from '@/components/SalonLoader';
import { fetchInitialActiveServices } from '@/lib/serverApi';

export const dynamic = 'force-dynamic';

export default async function BrowseServicesPage() {
  const initialServices = await fetchInitialActiveServices();
  return (
    <Suspense fallback={<SalonLoader size="lg" fullScreen label="Loading salon menu..." />}>
      <BrowseServicesClient initialServices={initialServices} />
    </Suspense>
  );
}
