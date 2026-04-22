'use client';

import { useFormStatus } from 'react-dom';
import { registerPilot } from '@/lib/actions';
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
import { PageHeader } from '@/components/page-header';
import { useEffect, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Registering...' : 'Register Pilot'}
    </Button>
  );
}

export default function RegisterPage() {
  const initialState: any = { errors: {} };
  const [state, dispatch] = useActionState(registerPilot, initialState);
  const { toast } = useToast();
  
  useEffect(() => {
    if (state.errors?._form) {
       toast({
        variant: "destructive",
        title: "Registration Failed",
        description: state.errors._form.join(', '),
      })
    }
  }, [state, toast])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Pilot Registration"
        description="Complete the form to register a new pilot for the event."
      />
      <form action={dispatch}>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>New Pilot Details</CardTitle>
            <CardDescription>
              All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
             {state.errors?._form && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {state.errors._form.join(', ')}
                  </AlertDescription>
                </Alert>
             )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Pilot Name *</Label>
                <Input id="name" name="name" placeholder="e.g., Alex Johnson" required />
                {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input id="teamName" name="teamName" placeholder="e.g., Team Velocity" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" required defaultValue="Amateur">
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Amateur">Amateur</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                </SelectContent>
              </Select>
               {state.errors?.category && <p className="text-sm text-destructive">{state.errors.category[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicleModel">Vehicle Model</Label>
              <Input id="vehicleModel" name="vehicleModel" placeholder="e.g., Vortex-9" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emergencyContact">Emergency Contact *</Label>
              <Input
                id="emergencyContact"
                name="emergencyContact"
                placeholder="e.g., Jane Doe - 555-1234"
                required
              />
              {state.errors?.emergencyContact && <p className="text-sm text-destructive">{state.errors.emergencyContact[0]}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
