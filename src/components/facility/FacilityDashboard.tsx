import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Loader2, Plus, Wifi, WifiOff } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useFacilitySocket, type FacilityAppointment } from '@/hooks/useFacilitySocket';
import { useSocketStatus } from '@/hooks/useSocket';

interface FacilityDashboardProps {
  facilityId: number;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  assigned:  'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  canceled:  'bg-red-100 text-red-700',
};

async function fetchAppointments(facilityId: number): Promise<FacilityAppointment[]> {
  return apiClient.get<FacilityAppointment[]>(`/facilities/${facilityId}/appointments`);
}

async function updateStatus(facilityId: number, appointmentId: number, status: string) {
  return apiClient.patch(`/facilities/${facilityId}/appointments/${appointmentId}/status`, { status });
}

async function assignSelf(facilityId: number, appointmentId: number) {
  return apiClient.post(`/facilities/${facilityId}/appointments/${appointmentId}/assign`, {});
}

async function createAppointment(
  facilityId: number,
  data: { mother_phone_number: string; scheduled_time: string; appointment_type?: string; notes?: string }
) {
  return apiClient.post<{ message: string; appointment: FacilityAppointment }>(`/facilities/${facilityId}/appointments`, data);
}

export function FacilityDashboard({ facilityId }: FacilityDashboardProps) {
  const [appointments, setAppointments] = useState<FacilityAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    motherPhoneNumber: '',
    scheduledTime: undefined as Date | undefined,
    appointmentType: 'prenatal_checkup',
    notes: '',
  });
  const { connected } = useSocketStatus();

  // Load initial appointments
  useEffect(() => {
    setLoading(true);
    fetchAppointments(facilityId)
      .then(setAppointments)
      .catch(() => setError('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, [facilityId]);

  // Real-time: new appointment arrives
  const onAppointmentCreated = useCallback((appt: FacilityAppointment) => {
    setAppointments(prev => {
      if (prev.some(a => a.id === appt.id)) return prev;
      return [appt, ...prev];
    });
  }, []);

  // Real-time: appointment updated (assigned / status change)
  const onAppointmentUpdated = useCallback((appt: FacilityAppointment) => {
    setAppointments(prev => prev.map(a => a.id === appt.id ? appt : a));
  }, []);

  useFacilitySocket({ onAppointmentCreated, onAppointmentUpdated });

  const handleAssign = async (apptId: number) => {
    try {
      await assignSelf(facilityId, apptId);
      // Optimistic update — socket will also push the real update
      setAppointments(prev => prev.map(a =>
        a.id === apptId ? { ...a, status: 'assigned' } : a
      ));
    } catch {
      setError('Failed to assign appointment');
    }
  };

  const handleStatusChange = async (apptId: number, status: string) => {
    try {
      await updateStatus(facilityId, apptId, status);
    } catch {
      setError('Failed to update status');
    }
  };

  const handleCreateAppointment = async () => {
    if (!createForm.motherPhoneNumber || !createForm.scheduledTime) {
      setError('Enter the mother phone number and appointment time.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setError('');
      const response = await createAppointment(facilityId, {
        mother_phone_number: createForm.motherPhoneNumber,
        scheduled_time: createForm.scheduledTime.toISOString(),
        appointment_type: createForm.appointmentType,
        notes: createForm.notes.trim() || undefined,
      });
      setAppointments(prev => prev.some(a => a.id === response.appointment.id) ? prev : [response.appointment, ...prev]);
      setShowCreateModal(false);
      setCreateForm({
        motherPhoneNumber: '',
        scheduledTime: undefined,
        appointmentType: 'prenatal_checkup',
        notes: '',
      });
    } catch {
      setError('Failed to create appointment. Confirm the mother phone number exists and that you have admin access.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const upcoming = appointments.filter(a => a.status !== 'completed' && a.status !== 'canceled');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'canceled');

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {connected
            ? <><Wifi className="h-4 w-4 text-green-500" /> Live updates active</>
            : <><WifiOff className="h-4 w-4 text-red-400" /> Reconnecting...</>
          }
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Appointment</DialogTitle>
              <DialogDescription>Use the mother's phone number to avoid name-matching errors.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Mother Phone Number</Label>
                <Input
                  value={createForm.motherPhoneNumber}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, motherPhoneNumber: e.target.value }))}
                  placeholder="07xxxxxxxx"
                  inputMode="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <DateTimePicker
                  date={createForm.scheduledTime}
                  setDate={(date) => setCreateForm(prev => ({ ...prev, scheduledTime: date }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select
                  value={createForm.appointmentType}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, appointmentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prenatal_checkup">Prenatal Checkup</SelectItem>
                    <SelectItem value="ultrasound">Ultrasound</SelectItem>
                    <SelectItem value="lab_test">Lab Test</SelectItem>
                    <SelectItem value="postnatal_care">Postnatal Care</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Optional notes"
                />
              </div>
              <Button className="w-full" onClick={handleCreateAppointment} disabled={createSubmitting}>
                {createSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : 'Create Appointment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {upcoming.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white text-xs">{upcoming.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No upcoming appointments</p>
          ) : (
            upcoming.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onAssign={() => handleAssign(appt.id)}
                onStatusChange={(s) => handleStatusChange(appt.id, s)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3 mt-4">
          {past.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No past appointments</p>
          ) : (
            past.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onAssign={() => {}}
                onStatusChange={() => {}}
                readonly
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: FacilityAppointment;
  onAssign: () => void;
  onStatusChange: (status: string) => void;
  readonly?: boolean;
}

function AppointmentCard({ appointment: a, onAssign, onStatusChange, readonly }: AppointmentCardProps) {
  const scheduledDate = new Date(a.scheduled_time);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{a.mother_name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[a.status] ?? ''}`}>
            {a.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {a.appointment_type && (
          <p className="text-sm"><span className="text-muted-foreground">Type:</span> {a.appointment_type}</p>
        )}
        {a.assigned_staff_name && (
          <p className="text-sm"><span className="text-muted-foreground">Assigned to:</span> {a.assigned_staff_name}</p>
        )}
        {a.notes && (
          <p className="text-sm text-muted-foreground italic">{a.notes}</p>
        )}
        {!readonly && (
          <div className="flex gap-2 pt-1 flex-wrap">
            {a.status === 'scheduled' && (
              <Button size="sm" variant="outline" onClick={onAssign}>
                Assign to Me
              </Button>
            )}
            {(a.status === 'scheduled' || a.status === 'assigned') && (
              <>
                <Button size="sm" variant="outline" onClick={() => onStatusChange('completed')}>
                  Mark Complete
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => onStatusChange('canceled')}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
