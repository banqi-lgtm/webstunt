import { PageHeader } from '@/components/page-header';
import { CommunicationClient } from './communication-client';
import { getPilots } from '@/lib/data';

export default async function CommunicatePage() {
  const pilots = await getPilots();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Communication Assistant"
        description="Draft personalized and context-aware messages for pilots with AI."
      />
      <CommunicationClient pilots={pilots} />
    </div>
  );
}
