/**
 * useFacilitySocket.ts
 * ─────────────────────
 * Hook for facility staff to receive real-time appointment events.
 *
 * The server emits to the `facility:{id}` room which the socket joins
 * automatically on connect (via the facility JWT identity).
 *
 * Events consumed:
 *   facility:appointment_created  – new appointment added
 *   facility:appointment_updated  – appointment assigned / status changed
 */

import { useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

export interface FacilityAppointment {
  id: number;
  facility_id: number;
  mother_id: number | null;
  mother_name: string;
  scheduled_time: string;
  appointment_type: string | null;
  status: 'scheduled' | 'assigned' | 'completed' | 'canceled';
  assigned_staff_account_id: number | null;
  assigned_staff_name: string | null;
  created_by_account_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseFacilitySocketOptions {
  /** Called when a new appointment is created at this facility */
  onAppointmentCreated?: (appointment: FacilityAppointment) => void;
  /** Called when an existing appointment is updated (assigned / status change) */
  onAppointmentUpdated?: (appointment: FacilityAppointment) => void;
  /** Set false to pause subscriptions */
  enabled?: boolean;
}

/**
 * Subscribe to real-time facility appointment events.
 *
 * @example
 * useFacilitySocket({
 *   onAppointmentCreated: (appt) => setAppointments(prev => [appt, ...prev]),
 *   onAppointmentUpdated: (appt) => setAppointments(prev =>
 *     prev.map(a => a.id === appt.id ? appt : a)
 *   ),
 * });
 */
export function useFacilitySocket({
  onAppointmentCreated,
  onAppointmentUpdated,
  enabled = true,
}: UseFacilitySocketOptions): void {
  const handleCreated = useCallback(
    (appt: FacilityAppointment) => onAppointmentCreated?.(appt),
    [onAppointmentCreated],
  );

  const handleUpdated = useCallback(
    (appt: FacilityAppointment) => onAppointmentUpdated?.(appt),
    [onAppointmentUpdated],
  );

  useSocket<FacilityAppointment>('facility:appointment_created', handleCreated, { enabled });
  useSocket<FacilityAppointment>('facility:appointment_updated', handleUpdated, { enabled });
}
