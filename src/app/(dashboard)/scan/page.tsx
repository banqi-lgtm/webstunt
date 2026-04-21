import { PageHeader } from '@/components/page-header';
import { ScanClient } from './scan-client';

export default function ScanPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Scan & Validate"
        description="Scan a pilot's QR code or enter their ID to validate entry."
      />
      <ScanClient />
    </div>
  );
}
