export interface Mother {
  id: string;
  name: string;
  phone: string;
  pregnancyWeek?: number;
  postpartumWeek?: number;
  lastCheckIn: string;
  status: 'ok' | 'not_ok' | 'no_response';
  assignedCHW: string;
  issues?: string[];
}

export interface CHW {
  id: string;
  name: string;
  phone: string;
  assignedMothers: string[];
}

export interface EscalatedCase {
  id: string;
  motherId: string;
  motherName: string;
  issue: string;
  escalatedBy: string;
  escalatedAt: string;
  status: 'pending' | 'resolved';
}

export interface WeeklyTip {
  week: number;
  title: string;
  content: string;
  category: 'nutrition' | 'warning_signs' | 'exercise' | 'general';
}

export const mockMothers: Mother[] = [
  {
    id: '1',
    name: 'Grace Wanjiku',
    phone: '+254701234567',
    pregnancyWeek: 24,
    lastCheckIn: '2024-01-28',
    status: 'ok',
    assignedCHW: 'chw1'
  },
  {
    id: '2',
    name: 'Mary Akinyi',
    phone: '+254702345678',
    pregnancyWeek: 32,
    lastCheckIn: '2024-01-27',
    status: 'not_ok',
    assignedCHW: 'chw1',
    issues: ['Headaches', 'Swelling']
  },
  {
    id: '3',
    name: 'Sarah Njeri',
    phone: '+254703456789',
    postpartumWeek: 2,
    lastCheckIn: '2024-01-28',
    status: 'ok',
    assignedCHW: 'chw1'
  },
  {
    id: '4',
    name: 'Ruth Muthoni',
    phone: '+254704567890',
    pregnancyWeek: 16,
    lastCheckIn: '2024-01-26',
    status: 'no_response',
    assignedCHW: 'chw2'
  },
  {
    id: '5',
    name: 'Joyce Wambui',
    phone: '+254705678901',
    pregnancyWeek: 28,
    lastCheckIn: '2024-01-28',
    status: 'not_ok',
    assignedCHW: 'chw2',
    issues: ['Bleeding', 'Severe nausea']
  },
  {
    id: '6',
    name: 'Elizabeth Nyambura',
    phone: '+254706789012',
    postpartumWeek: 4,
    lastCheckIn: '2024-01-28',
    status: 'ok',
    assignedCHW: 'chw2'
  }
];

export const mockCHWs: CHW[] = [
  {
    id: 'chw1',
    name: 'James Kiprotich',
    phone: '+254711234567',
    assignedMothers: ['1', '2', '3']
  },
  {
    id: 'chw2',
    name: 'Agnes Wanjiru',
    phone: '+254712345678',
    assignedMothers: ['4', '5', '6']
  }
];

export const mockEscalatedCases: EscalatedCase[] = [
  {
    id: '1',
    motherId: '2',
    motherName: 'Mary Akinyi',
    issue: 'Severe headaches and swelling - possible preeclampsia',
    escalatedBy: 'James Kiprotich',
    escalatedAt: '2024-01-28T09:30:00Z',
    status: 'pending'
  },
  {
    id: '2',
    motherId: '5',
    motherName: 'Joyce Wambui',
    issue: 'Unexplained bleeding in second trimester',
    escalatedBy: 'Agnes Wanjiru',
    escalatedAt: '2024-01-28T11:15:00Z',
    status: 'pending'
  }
];

export const weeklyTips: WeeklyTip[] = [
  {
    week: 24,
    title: 'Nutrition for Week 24',
    content: 'Focus on iron-rich foods like spinach, beans, and lean meat. Take your iron supplements with vitamin C to improve absorption.',
    category: 'nutrition'
  },
  {
    week: 24,
    title: 'Warning Signs to Watch',
    content: 'Contact your CHW immediately if you experience severe headaches, vision changes, or sudden swelling in hands and face.',
    category: 'warning_signs'
  },
  {
    week: 24,
    title: 'Safe Exercise',
    content: 'Light walking for 20-30 minutes daily is great. Avoid contact sports and activities with risk of falling.',
    category: 'exercise'
  }
];

// Current user context (normally would come from authentication)
export const currentUser = {
  role: 'mother' as 'mother' | 'chw' | 'nurse',
  id: '1',
  name: 'Grace Wanjiku'
};