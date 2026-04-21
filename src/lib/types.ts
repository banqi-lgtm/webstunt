export type Pilot = {
  id: string;
  name: string;
  registrationNumber: string;
  category: 'Pro' | 'Amateur' | 'Beginner';
  status: 'Confirmed' | 'Pending Payment' | 'Checked In' | 'Cancelled';
  teamName?: string;
  vehicleModel?: string;
  emergencyContact: string;
  registrationDate: string;
};
