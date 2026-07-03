import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, CalendarClock, UserPlus, Users, Wifi, WifiOff, Activity, ShieldCheck, ClipboardPlus, Settings2, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardAccountMenu } from '@/components/layout/DashboardAccountMenu';
import { normalizePhoneNumber } from '@/lib/utils';
import { facilityStaffAuthService, type FacilityStaffRecord } from '@/services/facilityStaffAuthService';
import { notificationService, type UserNotification } from '@/services/notificationService';
import {
  facilityAppointmentService,
  type FacilityAppointment,
  type FacilityDashboardSummary,
} from '@/services/facilityAppointmentService';
import {
  facilityEscalationService,
  type FacilityEscalation,
  type FacilityEscalationStatus,
} from '@/services/facilityEscalationService';
import { useSocket, useSocketStatus } from '@/hooks/useSocket';

const MEMBER_ROLE_OPTIONS = ['doctor', 'nurse'];

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function FacilityIndex() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingEscalations, setLoadingEscalations] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [staff, setStaff] = useState<FacilityStaffRecord[]>([]);
  const [appointments, setAppointments] = useState<FacilityAppointment[]>([]);
  const [escalations, setEscalations] = useState<FacilityEscalation[]>([]);
  const [dashboard, setDashboard] = useState<FacilityDashboardSummary | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [inviteForm, setInviteForm] = useState({
    invited_role: 'nurse',
    invitation_phone: '',
    invitation_email: '',
  });
  const [appointmentForm, setAppointmentForm] = useState({
    mother_phone_number: '',
    scheduled_time: '',
    appointment_type: '',
    notes: '',
  });
  const [settingsForm, setSettingsForm] = useState({
    phone: '',
    email: '',
    hours_text: '',
  });
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const facilityId = user?.facility_id;
  const minimumAppointmentDateTime = useMemo(() => formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)), []);

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const response = await facilityStaffAuthService.listStaff(facilityId);
      setStaff(response.staff);
      setIsAdmin(response.is_admin);
    } catch (error: unknown) {
      toast.error('Could not load staff list', { description: (error as Error).message });
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadAppointments = async () => {
    if (!facilityId) return;
    setLoadingAppointments(true);
    try {
      const response = await facilityAppointmentService.listAppointments(facilityId);
      setAppointments(response.appointments);
    } catch (error: unknown) {
      toast.error('Could not load appointments', { description: (error as Error).message });
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadDashboard = async () => {
    if (!facilityId) return;
    setLoadingDashboard(true);
    try {
      const response = await facilityAppointmentService.getDashboard(facilityId);
      setDashboard(response);
      setSettingsForm({
        phone: response.facility.phone || '',
        email: response.facility.email || '',
        hours_text: response.facility.hours_text || '',
      });
    } catch (error: unknown) {
      toast.error('Could not load facility overview', { description: (error as Error).message });
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadEscalations = async () => {
    if (!facilityId) return;
    setLoadingEscalations(true);
    try {
      const response = await facilityEscalationService.listEscalations(facilityId);
      setEscalations(response.escalations);
    } catch (error: unknown) {
      toast.error('Could not load escalations', { description: (error as Error).message });
    } finally {
      setLoadingEscalations(false);
    }
  };

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await notificationService.list(20, true);
      setNotifications(response.notifications);
      setUnreadNotificationCount(response.unread_count);
    } catch {
      // Ignore notification fetch errors so dashboard data still loads.
    }
  }, []);

  const markNotificationRead = async (id: number) => {
    try {
      const response = await notificationService.markRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadNotificationCount(response.unread_count);
    } catch {
      // Keep interaction non-blocking.
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications([]);
      setUnreadNotificationCount(0);
    } catch {
      // Keep interaction non-blocking.
    }
  };

  useEffect(() => {
    if (!facilityId) return;
    loadDashboard();
    loadStaff();
    loadAppointments();
    loadEscalations();
    refreshNotifications();
  }, [facilityId, refreshNotifications]);

  useSocket<FacilityAppointment>('facility:appointment_created', () => {
    if (facilityId) {
      loadAppointments();
      refreshNotifications();
    }
  }, { enabled: !!facilityId });

  useSocket<FacilityAppointment>('facility:appointment_updated', () => {
    if (facilityId) {
      loadAppointments();
      refreshNotifications();
    }
  }, { enabled: !!facilityId });

  useSocket<{ facility_appointments?: FacilityAppointment[] }>('sync', (payload) => {
    if (payload.facility_appointments) {
      setAppointments(payload.facility_appointments);
    }
    if ((payload as { facility_escalations?: FacilityEscalation[] }).facility_escalations) {
      setEscalations((payload as { facility_escalations: FacilityEscalation[] }).facility_escalations);
    }
  }, { enabled: !!facilityId });

  useSocket<FacilityEscalation>('facility:escalation_created', () => {
    if (facilityId) {
      loadEscalations();
      refreshNotifications();
    }
  }, { enabled: !!facilityId });

  useSocket<FacilityEscalation>('facility:escalation_updated', () => {
    if (facilityId) {
      loadEscalations();
      refreshNotifications();
    }
  }, { enabled: !!facilityId });

  useSocket('notification:new', () => {
    refreshNotifications();
  }, { enabled: !!user?.id });

  useSocket<{ staff?: FacilityStaffRecord[] }>('facility:staff_update', (payload) => {
    if (payload.staff) {
      setStaff(payload.staff);
      setIsAdmin(payload.staff.some((member) => member.account_id === user?.id && member.role === 'admin' && member.status === 'active'));
    } else if (facilityId) {
      loadStaff();
    }
  }, { enabled: !!facilityId });

  const inviteStaff = async () => {
    if (!facilityId) {
      toast.error('No facility is linked to your account');
      return;
    }

    try {
      await facilityStaffAuthService.inviteStaff({
        facility_id: facilityId,
        invited_role: inviteForm.invited_role as 'doctor' | 'nurse',
        invitation_phone: inviteForm.invitation_phone ? normalizePhoneNumber(inviteForm.invitation_phone) : undefined,
        invitation_email: inviteForm.invitation_email || undefined,
      });
      toast.success('Invitation sent');
      setInviteForm((prev) => ({ ...prev, invitation_phone: '', invitation_email: '' }));
      loadStaff();
    } catch (error: unknown) {
      toast.error('Invitation failed', { description: (error as Error).message });
    }
  };

  const updateStaff = async (row: FacilityStaffRecord, patch: Partial<Pick<FacilityStaffRecord, 'role' | 'status'>>) => {
    try {
      await facilityStaffAuthService.updateStaff(row.id, patch);
      toast.success('Staff updated');
      loadStaff();
    } catch (error: unknown) {
      toast.error('Update failed', { description: (error as Error).message });
    }
  };

  const createAppointment = async () => {
    if (!facilityId) return;
    if (!appointmentForm.mother_phone_number || !appointmentForm.scheduled_time) {
      toast.error('Mother phone number and scheduled time are required');
      return;
    }
    try {
      await facilityAppointmentService.createAppointment(facilityId, {
        mother_phone_number: normalizePhoneNumber(appointmentForm.mother_phone_number),
        scheduled_time: new Date(appointmentForm.scheduled_time).toISOString(),
        appointment_type: appointmentForm.appointment_type || undefined,
        notes: appointmentForm.notes || undefined,
      });
      toast.success('Appointment created');
      setAppointmentForm({ mother_phone_number: '', scheduled_time: '', appointment_type: '', notes: '' });
      loadAppointments();
      loadDashboard();
    } catch (error: unknown) {
      toast.error('Could not create appointment', { description: (error as Error).message });
    }
  };

  const assignToMe = async (appointmentId: number) => {
    if (!facilityId) return;
    try {
      await facilityAppointmentService.assignAppointment(facilityId, appointmentId);
      toast.success('Appointment assigned to you');
      loadAppointments();
    } catch (error: unknown) {
      toast.error('Could not assign appointment', { description: (error as Error).message });
    }
  };

  const saveSettings = async () => {
    if (!facilityId) return;
    try {
      await facilityAppointmentService.updateSettings(facilityId, settingsForm);
      toast.success('Facility settings saved');
      loadDashboard();
    } catch (error: unknown) {
      toast.error('Settings update failed', { description: (error as Error).message });
    }
  };

  const canAssign = (row: FacilityAppointment) => {
    return row.status !== 'completed' && row.status !== 'canceled' && row.assigned_staff_account_id !== user?.id;
  };

  const canUpdateStatus = (row: FacilityAppointment) => {
    if (isAdmin) return true;
    return row.assigned_staff_account_id === user?.id;
  };

  const updateStatus = async (appointmentId: number, status: 'completed' | 'canceled') => {
    if (!facilityId) return;
    try {
      await facilityAppointmentService.updateAppointmentStatus(facilityId, appointmentId, status);
      toast.success(`Appointment marked as ${status}`);
      loadAppointments();
    } catch (error: unknown) {
      toast.error('Could not update status', { description: (error as Error).message });
    }
  };

  const assignEscalation = async (escalationId: number, assignedAccountId: number) => {
    if (!facilityId) return;
    try {
      await facilityEscalationService.assignEscalation(facilityId, escalationId, assignedAccountId);
      toast.success('Escalation assigned');
      loadEscalations();
    } catch (error: unknown) {
      toast.error('Could not assign escalation', { description: (error as Error).message });
    }
  };

  const updateEscalationStatus = async (escalationId: number, status: FacilityEscalationStatus) => {
    if (!facilityId) return;
    try {
      await facilityEscalationService.updateEscalationStatus(facilityId, escalationId, status);
      toast.success(`Escalation marked ${status}`);
      loadEscalations();
    } catch (error: unknown) {
      toast.error('Could not update escalation', { description: (error as Error).message });
    }
  };

  const { connected } = useSocketStatus();

  const appointmentSummary = useMemo(() => {
    const total = appointments.length;
    const assigned = appointments.filter((a) => a.status === 'assigned').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    return { total, assigned, completed };
  }, [appointments]);

  const pendingAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'scheduled' || a.status === 'assigned').length,
    [appointments],
  );

  const assignableStaff = useMemo(
    () => staff.filter((member) => member.account_id && member.status === 'active' && (member.role === 'doctor' || member.role === 'nurse')),
    [staff],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="app-shell-inner space-y-4 sm:space-y-5">
        <section className="dashboard-hero">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary-foreground/80">Facility Operations</p>
              <h1 className="text-xl sm:text-2xl font-semibold leading-tight">{dashboard?.facility.name || 'Facility Staff Dashboard'}</h1>
              <p className="text-sm sm:text-base text-primary-foreground/85 mt-1">
                Signed in as {user?.first_name} {user?.last_name} ({user?.role})
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Badge className="bg-white/15 text-white border-white/25 hover:bg-white/20">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {isAdmin ? 'Admin Access' : 'Staff Access'}
                </Badge>
                <Badge className="bg-white/15 text-white border-white/25 hover:bg-white/20">
                  <Activity className="mr-1 h-3.5 w-3.5" />
                  {pendingAppointments} Active Appointments
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <Badge variant="outline" className="border-white/35 text-white bg-transparent">
                {connected
                  ? <><span className="status-dot bg-emerald-400 mr-1.5" /> <Wifi className="mr-1 h-3.5 w-3.5" /> Live</>
                  : <><span className="status-dot bg-red-400 mr-1.5" /> <WifiOff className="mr-1 h-3.5 w-3.5" /> Reconnecting</>
                }
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="relative bg-white/15 text-white border-white/25 hover:bg-white/25">
                    <Bell className="h-4 w-4" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadNotificationCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={markAllNotificationsRead}>
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 && (
                    <DropdownMenuItem className="text-muted-foreground">No notifications yet</DropdownMenuItem>
                  )}
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                      onClick={async () => {
                        await markNotificationRead(notification.id);
                        if (notification.url) navigate(notification.url);
                      }}
                    >
                      <span className="text-sm font-medium">{notification.title}</span>
                      <span className="text-sm">{notification.message}</span>
                      <span className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DashboardAccountMenu
                userName={`${user?.first_name || ''} ${user?.last_name || ''}`.trim()}
                phoneNumber={user?.phone_number}
                profileImage={null}
                fallbackText={user?.first_name?.charAt(0).toUpperCase() || 'F'}
                onProfile={() => setActiveTab('profile')}
                onSettings={() => setActiveTab('settings')}
                onLogout={logout}
              />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Facility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold line-clamp-1">{dashboard?.facility.name || 'Loading...'}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{dashboard?.facility.address || dashboard?.facility.city || 'No address set'}</p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Staff Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{dashboard?.stats.staff_count ?? staff.length}</p>
              <p className="text-xs text-muted-foreground">Doctors and nurses linked to this facility</p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Monthly Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{dashboard?.stats.appointments_this_month ?? 0}</p>
              <p className="text-xs text-muted-foreground">{appointmentSummary.assigned} assigned, {appointmentSummary.completed} completed</p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Workload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{pendingAppointments}</p>
              <p className="text-xs text-muted-foreground">Scheduled + assigned appointments</p>
            </CardContent>
          </Card>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="dashboard-tabs p-3 sm:p-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 gap-2 h-auto bg-transparent p-0">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="escalations">Escalations</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4 bg-white rounded-lg p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Facility Account Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{user?.phone_number || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{user?.role || 'facility_staff'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Facility ID</p>
                    <p className="font-medium">{facilityId || 'Not linked'}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" onClick={() => setActiveTab('settings')}>Manage Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-4 mt-4 bg-white rounded-lg p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Facility Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDashboard ? (
                    <p className="text-sm text-muted-foreground">Loading facility details...</p>
                  ) : (
                    <>
                      <p className="font-semibold line-clamp-1">{dashboard?.facility.name || 'Unknown Facility'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{dashboard?.facility.address || dashboard?.facility.city || 'No address set'}</p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        <p>{dashboard?.facility.phone || 'No phone configured'}</p>
                        <p>{dashboard?.facility.email || 'No email configured'}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Team Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{dashboard?.stats.staff_count ?? staff.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active team members ready for assignments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Appointment Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{appointmentSummary.total}</p>
                  <p className="text-xs text-muted-foreground">{appointmentSummary.assigned} assigned, {appointmentSummary.completed} completed, {pendingAppointments} active</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4 mt-4 bg-white rounded-lg p-4">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><ClipboardPlus className="h-4 w-4" /> Create Appointment</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Mother Phone Number</Label>
                    <Input
                      value={appointmentForm.mother_phone_number}
                      onChange={(e) => setAppointmentForm((prev) => ({ ...prev, mother_phone_number: e.target.value }))}
                      placeholder="07xxxxxxxx"
                      inputMode="tel"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Scheduled Time</Label>
                    <Input
                      type="datetime-local"
                      min={minimumAppointmentDateTime}
                      value={appointmentForm.scheduled_time}
                      onChange={(e) => setAppointmentForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Input
                      value={appointmentForm.appointment_type}
                      onChange={(e) => setAppointmentForm((prev) => ({ ...prev, appointment_type: e.target.value }))}
                      placeholder="ANC Visit"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={createAppointment}>Create Appointment</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facility Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <p className="text-sm text-muted-foreground">Loading appointments...</p>
                ) : appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No appointments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((row) => (
                      <article key={row.id} className="border rounded-lg p-3 sm:p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{row.mother_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(row.scheduled_time).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground capitalize">{row.appointment_type || 'General consultation'}</p>
                          {row.ticket_code && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Ticket Code: <span className="font-mono text-foreground">{row.ticket_code}</span>
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">{row.status}</Badge>
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                              {row.assigned_staff_name || 'Unassigned'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                          {canAssign(row) ? (
                            <Button variant="outline" onClick={() => assignToMe(row.id)}>
                              Assign To Me
                            </Button>
                          ) : null}

                          {(row.status === 'scheduled' || row.status === 'assigned') && canUpdateStatus(row) && (
                            <>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(row.id, 'completed')}>
                              Complete
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => updateStatus(row.id, 'canceled')}>
                              Cancel
                            </Button>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escalations" className="space-y-4 mt-4 bg-white rounded-lg p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facility Escalations</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEscalations ? (
                  <p className="text-sm text-muted-foreground">Loading escalations...</p>
                ) : escalations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No escalations yet.</p>
                ) : (
                  <div className="space-y-3">
                    {escalations.map((row) => (
                      <article key={row.id} className="border rounded-lg p-3 sm:p-4 flex flex-col gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{row.mother_name}</p>
                            <Badge variant="outline" className="capitalize">{row.priority}</Badge>
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">{row.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{row.case_description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Assigned: {row.assigned_staff_name || 'Unassigned'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isAdmin && (
                            <Select
                              value={row.assigned_staff_account_id ? String(row.assigned_staff_account_id) : 'unassigned'}
                              onValueChange={(value) => {
                                if (value === 'unassigned') return;
                                assignEscalation(row.id, Number(value));
                              }}
                            >
                              <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Assign doctor/nurse" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {assignableStaff.map((member) => (
                                  <SelectItem key={member.id} value={String(member.account_id)}>
                                    {(member.user_name || 'Staff member')} ({member.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {(isAdmin || row.permissions?.can_update_status) && row.status !== 'checked_out' && (
                            <>
                              {row.status === 'received' && (
                                <Button size="sm" variant="outline" onClick={() => updateEscalationStatus(row.id, 'in_progress')}>
                                  Start Progress
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => updateEscalationStatus(row.id, 'checked_out')}>
                                Check Out
                              </Button>
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4 mt-4 bg-white rounded-lg p-4">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Select
                      value={inviteForm.invited_role}
                      onValueChange={(value) => setInviteForm((prev) => ({ ...prev, invited_role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input
                      placeholder="0712345678"
                      value={inviteForm.invitation_phone}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, invitation_phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="staff@example.com"
                      value={inviteForm.invitation_email}
                      onChange={(e) => setInviteForm((prev) => ({ ...prev, invitation_email: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={inviteStaff}>Add Member</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Member List</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStaff ? (
                  <p className="text-sm text-muted-foreground">Loading staff...</p>
                ) : staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff found yet.</p>
                ) : (
                  <div className="space-y-3">
                    {staff.map((row) => (
                      <article key={row.id} className="border rounded-lg p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-1">{row.user_name || 'Unknown staff'}</p>
                          <p className="text-xs text-muted-foreground">{row.phone_number || '-'}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">{row.role}</Badge>
                            <Badge className={row.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}>
                              {row.status}
                            </Badge>
                          </div>
                        </div>

                        {isAdmin && row.role !== 'admin' ? (
                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <Select value={row.role} onValueChange={(value) => updateStaff(row, { role: value as FacilityStaffRecord['role'] })}>
                              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {MEMBER_ROLE_OPTIONS.map((role) => (
                                  <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={row.status} onValueChange={(value) => updateStaff(row, { status: value as FacilityStaffRecord['status'] })}>
                              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending_verification">pending_verification</SelectItem>
                                <SelectItem value="active">active</SelectItem>
                                <SelectItem value="inactive">inactive</SelectItem>
                                <SelectItem value="removed">removed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4 bg-white rounded-lg p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4" /> Facility Contact & Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+2547..."
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="facility@example.com"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Hours</Label>
                  <Textarea
                    value={settingsForm.hours_text}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, hours_text: e.target.value }))}
                    placeholder="Mon-Fri 8:00 AM - 5:00 PM"
                    disabled={!isAdmin}
                  />
                </div>
                {isAdmin ? <Button onClick={saveSettings}>Save Settings</Button> : <p className="text-xs text-muted-foreground">Only facility admin can update settings.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
