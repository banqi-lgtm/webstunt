'use server';

import { z } from 'zod';
import { addPilot, getPilotById, getPilots } from './data';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { pilotInfoSummarizer } from '@/ai/flows/pilot-info-summarizer-flow';
import { draftCommunication } from '@/ai/flows/communication-drafting-assistant-flow';

const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  teamName: z.string().optional(),
  category: z.enum(['Pro', 'Amateur', 'Beginner']),
  vehicleModel: z.string().optional(),
  emergencyContact: z.string().min(5, 'Emergency contact is required'),
});

export async function registerPilot(prevState: any, formData: FormData) {
  const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const newPilot = await addPilot(validatedFields.data);
    
    // Simulate sending email and WhatsApp confirmation
    console.log(`Confirmation email and WhatsApp message sent to ${newPilot.name}`);
    
    revalidatePath('/');
    redirect(`/pilots/${newPilot.id}`);
  } catch (error) {
    return {
      errors: { _form: ['An unexpected error occurred.'] },
    };
  }
}

export async function validatePilot(pilotId: string) {
  try {
    const pilot = await getPilotById(pilotId);
    if (!pilot) {
      return { error: 'Pilot not found.' };
    }

    const summary = await pilotInfoSummarizer({
      pilotName: pilot.name,
      registrationNumber: pilot.registrationNumber,
      category: pilot.category,
      status: pilot.status,
      teamName: pilot.teamName,
      vehicleModel: pilot.vehicleModel,
      emergencyContact: pilot.emergencyContact,
    });

    return { pilot, summary };
  } catch (error) {
    console.error('Validation error:', error);
    return { error: 'Failed to validate pilot.' };
  }
}


const communicationSchema = z.object({
    pilotId: z.string(),
    messagePurpose: z.string().min(1, "Purpose is required."),
    specificContext: z.string().optional(),
});

export async function createDrafts(prevState: any, formData: FormData) {
    const validatedFields = communicationSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: 'Invalid input.' };
    }

    const { pilotId, messagePurpose, specificContext } = validatedFields.data;
    const pilot = await getPilotById(pilotId);

    if (!pilot) {
        return { error: 'Pilot not found.' };
    }

    try {
        const drafts = await draftCommunication({
            pilotName: pilot.name,
            messagePurpose,
            specificContext,
            eventDetails: "Circuito Control Race Weekend. Location: Main Speedway. Dates: 25-27 October."
        });
        return { drafts };
    } catch (error) {
        console.error("Drafting error:", error);
        return { error: 'Failed to generate communication drafts.' };
    }
}
