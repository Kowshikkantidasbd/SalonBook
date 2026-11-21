import { ServiceDetailsClient } from '@/components/ServiceDetailsClient';
import { fetchInitialServiceById } from '@/lib/serverApi';

export const dynamic = 'force-dynamic';

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialService = await fetchInitialServiceById(id);
  return <ServiceDetailsClient id={id} initialService={initialService} />;
}
