'use server';
/**
 * @fileOverview A Genkit flow for drafting personalized and context-aware email and WhatsApp messages for pilots.
 *
 * - draftCommunication - A function that handles the message drafting process.
 * - DraftCommunicationInput - The input type for the draftCommunication function.
 * - DraftCommunicationOutput - The return type for the draftCommunication function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftCommunicationInputSchema = z.object({
  messagePurpose: z
    .string()
    .describe(
      'The main purpose or topic of the message, e.g., "event update", "response to inquiry about schedule", "welcome message".'
    ),
  pilotName: z.string().describe('The name of the pilot to whom the message is addressed.'),
  eventDetails: z
    .string()
    .describe(
      'General event details that might be relevant, such as dates, location, or general rules.'
    ),
  specificContext: z
    .string()
    .optional()
    .describe(
      'Any additional specific details or information to include in this particular message.'
    ),
});
export type DraftCommunicationInput = z.infer<typeof DraftCommunicationInputSchema>;

const DraftCommunicationOutputSchema = z.object({
  emailSubject: z.string().describe('A concise and informative subject line for the email.'),
  emailBody: z
    .string()
    .describe('The full draft content of the email, professional and detailed.'),
  whatsappMessage: z
    .string()
    .describe(
      'A concise draft message suitable for WhatsApp, focusing on key information.'
    ),
});
export type DraftCommunicationOutput = z.infer<typeof DraftCommunicationOutputSchema>;

export async function draftCommunication(
  input: DraftCommunicationInput
): Promise<DraftCommunicationOutput> {
  return draftCommunicationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftCommunicationPrompt',
  input: {schema: DraftCommunicationInputSchema},
  output: {schema: DraftCommunicationOutputSchema},
  prompt: `You are an AI assistant helping an event organizer draft personalized communication for pilots participating in their event.\n\nYour task is to generate a draft email subject, email body, and a WhatsApp message based on the provided purpose, pilot name, event details, and specific context.\n\nEnsure the tone is professional yet friendly for both platforms. The email should be more detailed, while the WhatsApp message should be concise and to the point.\n\n---\nMessage Purpose: {{{messagePurpose}}}\nPilot Name: {{{pilotName}}}\nEvent Details: {{{eventDetails}}}\n{{#if specificContext}}\nSpecific Context: {{{specificContext}}}\n{{/if}}\n---\n\nGenerate the messages following these guidelines:\n1.  **Email Subject**: A clear, concise, and informative subject line.\n2.  **Email Body**: A professional and detailed message, addressing the pilot by name, providing necessary information based on the purpose, event details, and specific context. Include a friendly closing.\n3.  **WhatsApp Message**: A short, direct, and actionable message suitable for mobile, addressing the pilot by name, and summarizing the key information.`,
});

const draftCommunicationFlow = ai.defineFlow(
  {
    name: 'draftCommunicationFlow',
    inputSchema: DraftCommunicationInputSchema,
    outputSchema: DraftCommunicationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
