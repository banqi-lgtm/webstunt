'use client';

import { useState } from 'react';
import { validatePilot } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { QrCode, CheckCircle, XCircle, Loader, Sparkles } from 'lucide-react';
import type { Pilot } from '@/lib/types';
import type { PilotInfoSummarizerOutput } from '@/ai/flows/pilot-info-summarizer-flow';

type ValidationResult = {
  pilot: Pilot;
  summary: PilotInfoSummarizerOutput;
} | {
  error: string;
} | null;

export function ScanClient() {
  const [pilotId, setPilotId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotId) return;
    setLoading(true);
    setResult(null);
    const validationResult = await validatePilot(pilotId);
    setResult(validationResult);
    setLoading(false);
  };
  
  const qrCodeUrl = (id: string) => `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${id}&bgcolor=181B1F&color=64D2F0&qzone=1`;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle>QR Validator</CardTitle>
          <CardDescription>
            Enter the Pilot ID from the QR code to validate their registration.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pilotId">Pilot ID</Label>
              <div className="flex gap-2">
                <Input
                  id="pilotId"
                  name="pilotId"
                  placeholder="Paste pilot ID here..."
                  value={pilotId}
                  onChange={(e) => setPilotId(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !pilotId}>
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  <span className="sr-only">Validate</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </form>
      </Card>

      {loading && (
        <Card className="flex items-center justify-center p-16">
          <div className="flex flex-col items-center gap-4">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Validating...</p>
          </div>
        </Card>
      )}

      {result && (
        <div className="md:col-start-2 md:row-start-1">
          {'error' in result ? (
            <Card className="border-destructive animate-in fade-in zoom-in-95">
              <CardHeader className="flex flex-row items-center gap-4 text-destructive">
                <XCircle className="h-10 w-10" />
                <div>
                  <CardTitle>Invalid Entry</CardTitle>
                  <CardDescription className="text-destructive/80">
                    {result.error}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ) : (
            <Card className="border-green-500 animate-in fade-in zoom-in-95">
              <CardHeader className="flex flex-col sm:flex-row items-start gap-4 text-green-500">
                <CheckCircle className="h-10 w-10 flex-shrink-0" />
                <div className="flex-grow">
                  <CardTitle>Entry Validated</CardTitle>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-foreground">
                    <dt className="text-muted-foreground">Pilot:</dt><dd className="font-semibold">{result.pilot.name}</dd>
                    <dt className="text-muted-foreground">Status:</dt><dd><Badge variant="secondary">{result.pilot.status}</Badge></dd>
                  </dl>
                </div>
                <div className="bg-accent/10 p-1 rounded-md border border-dashed self-center sm:self-start">
                   <Image
                    src={qrCodeUrl(result.pilot.id)}
                    alt={`QR Code for ${result.pilot.name}`}
                    width={80}
                    height={80}
                    unoptimized
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Alert>
                  <Sparkles className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary flex items-center gap-2">AI Generated Summary</AlertTitle>
                  <AlertDescription>
                    <p className="font-semibold mt-2">{result.summary.summary}</p>
                    <p className="mt-2">{result.summary.personalizedInstructions}</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
