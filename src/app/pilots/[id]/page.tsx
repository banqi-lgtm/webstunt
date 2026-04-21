import { getPilotById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PilotDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function PilotDetailPage({ params }: PilotDetailPageProps) {
  const pilot = await getPilotById(params.id);

  if (!pilot) {
    notFound();
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${pilot.id}&bgcolor=181B1F&color=64D2F0&qzone=1`;
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'default';
      case 'Checked In': return 'secondary';
      case 'Pending Payment': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={pilot.name}
        description={`Registration #${pilot.registrationNumber}`}
      >
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </PageHeader>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Pilot Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Team</dt>
                  <dd className="font-medium">{pilot.teamName || 'N/A'}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Vehicle Model</dt>
                  <dd className="font-medium">{pilot.vehicleModel || 'N/A'}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd className="font-medium">{pilot.category}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Registration Status</dt>
                  <dd><Badge variant={getStatusVariant(pilot.status)}>{pilot.status}</Badge></dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Emergency Contact</dt>
                  <dd className="font-medium">{pilot.emergencyContact}</dd>
                </div>
                 <div className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">Registration Date</dt>
                  <dd className="font-medium">{new Date(pilot.registrationDate).toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Entry QR Code</CardTitle>
              <CardDescription>
                Scan this code at event check-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
              <div className="bg-accent/10 p-4 rounded-lg border border-dashed">
                <Image
                  src={qrCodeUrl}
                  alt={`QR Code for ${pilot.name}`}
                  width={250}
                  height={250}
                  className="rounded-md"
                  unoptimized // QR code API generates a static image
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
