import type { Pilot } from './types';

let pilots: Pilot[] = [
  {
    id: 'd2727c5f-33da-4293-8031-4a3e7423694e',
    name: 'Alex "Vortex" Johnson',
    registrationNumber: 'CC-2024-001',
    category: 'Pro',
    status: 'Checked In',
    teamName: 'Team Velocity',
    vehicleModel: 'Vortex-9',
    emergencyContact: 'Jane Johnson - 555-0101',
    registrationDate: '2024-05-10T10:00:00Z',
  },
  {
    id: 'f7a8e1b2-9c3d-4f4a-8b1e-2a5c6d7e8f9a',
    name: 'Mia "Phoenix" Wong',
    registrationNumber: 'CC-2024-002',
    category: 'Pro',
    status: 'Confirmed',
    teamName: 'Phoenix Racing',
    vehicleModel: 'Blaze-R',
    emergencyContact: 'Kenji Wong - 555-0102',
    registrationDate: '2024-05-12T14:30:00Z',
  },
  {
    id: 'c3b4a5d6-e7f8-9a0b-1c2d-3e4f5a6b7c8d',
    name: 'Ben "Rookie" Carter',
    registrationNumber: 'CC-2024-003',
    category: 'Amateur',
    status: 'Pending Payment',
    emergencyContact: 'Sarah Carter - 555-0103',
    registrationDate: '2024-05-15T09:00:00Z',
  },
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Chloe "Comet" Davis',
    registrationNumber: 'CC-2024-004',
    category: 'Beginner',
    status: 'Confirmed',
    teamName: 'Stardust Racers',
    vehicleModel: 'Nova-Sprint',
    emergencyContact: 'Mark Davis - 555-0104',
    registrationDate: '2024-05-18T11:45:00Z',
  },
];

// Simulate database latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getPilots(): Promise<Pilot[]> {
  await delay(100);
  return pilots.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
}

export async function getPilotById(id: string): Promise<Pilot | undefined> {
  await delay(50);
  return pilots.find((p) => p.id === id);
}

export async function addPilot(data: Omit<Pilot, 'id' | 'registrationNumber' | 'status' | 'registrationDate'>): Promise<Pilot> {
  await delay(200);
  const newPilot: Pilot = {
    id: crypto.randomUUID(),
    registrationNumber: `CC-2024-${(pilots.length + 1).toString().padStart(3, '0')}`,
    status: 'Confirmed',
    registrationDate: new Date().toISOString(),
    ...data,
  };
  pilots.push(newPilot);
  return newPilot;
}
