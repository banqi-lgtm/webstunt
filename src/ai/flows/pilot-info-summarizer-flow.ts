'use server';
/**
 * @fileOverview This file provides a Genkit flow for summarizing pilot registration details.
 *
 * - pilotInfoSummarizer - A function that generates a concise summary of a pilot's registration details and personalized instructions.
 * - PilotInfoSummarizerInput - The input type for the pilotInfoSummarizer function.
 * - PilotInfoSummarizerOutput - The return type for the pilotInfoSummarizer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PilotInfoSummarizerInputSchema = z.object({
  pilotName: z.string().describe('The full name of the pilot.'),
  registrationNumber: z.string().describe('The unique registration number assigned to the pilot.'),
  category: z.string().describe('The racing category or class the pilot is registered in.'),
  status: z.string().describe('The current registration status of the pilot (e.g., "Confirmed", "Pending Payment", "Checked In").'),
  teamName: z.string().optional().describe('The name of the team the pilot belongs to, if any.'),
  vehicleModel: z.string().optional().describe('The model of the vehicle the pilot is using.'),
  emergencyContact: z.string().optional().describe('Emergency contact information for the pilot.'),
  notesForStaff: z.string().optional().describe('Any special notes or instructions relevant for event staff regarding this pilot.'),
});
export type PilotInfoSummarizerInput = z.infer<typeof PilotInfoSummarizerInputSchema>;

const PilotInfoSummarizerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the pilot\'s registration details.'),
  personalizedInstructions: z.string().describe('Personalized instructions or important reminders for the pilot relevant to their entry.'),
});
export type PilotInfoSummarizerOutput = z.infer<typeof PilotInfoSummarizerOutputSchema>;

export async function pilotInfoSummarizer(input: PilotInfoSummarizerInput): Promise<PilotInfoSummarizerOutput> {
  return pilotInfoSummarizerFlow(input);
}

const pilotInfoSummarizerPrompt = ai.definePrompt({
  name: 'pilotInfoSummarizerPrompt',
  input: {schema: PilotInfoSummarizerInputSchema},
  output: {schema: PilotInfoSummarizerOutputSchema},
  prompt: `You are an event staff assistant for 'Circuito Control'. Your task is to provide a concise summary of a pilot's registration details and personalized instructions for entry, based on the provided information.

Pilot Details:
- Name: {{{pilotName}}}
- Registration Number: {{{registrationNumber}}}
- Category: {{{category}}}
- Status: {{{status}}}
{{#if teamName}}
- Team: {{{teamName}}}
{{/if}}
{{#if vehicleModel}}
- Vehicle: {{{vehicleModel}}}
{{/if}}
{{#if emergencyContact}}
- Emergency Contact: {{{emergencyContact}}}
{{/if}}
{{#if notesForStaff}}
- Staff Notes: {{{notesForStaff}}}
{{/if}}

Based on these details, generate a concise summary and any personalized instructions. Ensure the instructions are actionable and relevant for the pilot's entry process or immediate needs at the event. Format your response as a JSON object with 'summary' and 'personalizedInstructions' fields.`,
});

const pilotInfoSummarizerFlow = ai.defineFlow(
  {
    name: 'pilotInfoSummarizerFlow',
    inputSchema: PilotInfoSummarizerInputSchema,
    outputSchema: PilotInfoSummarizerOutputSchema,
  },
  async (input) => {
    const {output} = await pilotInfoSummarizerPrompt(input);
    if (!output) {
      throw new Error('Failed to generate pilot information summary.');
    }
    return output;
  }
);
