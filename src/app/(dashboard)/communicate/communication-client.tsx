'use client';

import { useFormStatus } from 'react-dom';
import { createDrafts } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Pilot } from '@/lib/types';
import { Sparkles, Clipboard, Check } from 'lucide-react';
import { useState, useActionState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Drafting...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" /> Generate Drafts
        </>
      )}
    </Button>
  );
}

function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-7 w-7">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
    </Button>
  );
}

export function CommunicationClient({ pilots }: { pilots: Pilot[] }) {
  const [state, formAction] = useActionState(createDrafts, undefined);

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Draft a Message</CardTitle>
            <CardDescription>
              Select a pilot and describe the message purpose. AI will do the rest.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pilotId">Pilot</Label>
              <Select name="pilotId" required>
                <SelectTrigger id="pilotId">
                  <SelectValue placeholder="Select a pilot..." />
                </SelectTrigger>
                <SelectContent>
                  {pilots.map((pilot) => (
                    <SelectItem key={pilot.id} value={pilot.id}>
                      {pilot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="messagePurpose">Message Purpose</Label>
              <Input
                id="messagePurpose"
                name="messagePurpose"
                placeholder="e.g., Event schedule update, Welcome message"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specificContext">Specific Context (Optional)</Label>
              <Textarea
                id="specificContext"
                name="specificContext"
                placeholder="e.g., Track is wet, please use wet tires. Registration desk has moved."
              />
            </div>
             {state?.error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
             )}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      {state?.drafts && (
        <div className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
                <div className='flex justify-between items-center'>
                     <CardTitle>Email Draft</CardTitle>
                     <CopyButton textToCopy={`Subject: ${state.drafts.emailSubject}\n\n${state.drafts.emailBody}`} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="emailSubject">Subject</Label>
                    <Input id="emailSubject" readOnly value={state.drafts.emailSubject} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="emailBody">Body</Label>
                    <Textarea id="emailBody" readOnly value={state.drafts.emailBody} className="h-48" />
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                 <div className='flex justify-between items-center'>
                    <CardTitle>WhatsApp Draft</CardTitle>
                    <CopyButton textToCopy={state.drafts.whatsappMessage} />
                 </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea readOnly value={state.drafts.whatsappMessage} className="h-28" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
