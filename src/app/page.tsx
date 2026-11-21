import { HomePageClient } from '@/components/HomePageClient';
import { fetchInitialActiveServices } from '@/lib/serverApi';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialServices = await fetchInitialActiveServices();
  return <HomePageClient initialServices={initialServices} />;
}
