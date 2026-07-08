import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardPlus,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  TriangleAlert,
  User,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { DashboardAccountMenu } from '@/components/layout/DashboardAccountMenu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { useSocket, useSocketStatus } from '@/hooks/useSocket';
import { normalizePhoneNumber, cn } from '@/lib/utils';
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
import { facilityStaffAuthService, type FacilityStaffRecord } from '@/services/facilityStaffAuthService';
import { notificationService, type UserNotification } from '@/services/notificationService';

const MEMBER_ROLE_OPTIONS = ['doctor', 'nurse'] as const;
const FACILITY_BASE_PATH = '/dashboard/facility';
const SIDEBAR_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'appointments', label: 'Appointments', icon: CalendarClock },
  { key: 'escalations', label: 'Escalations', icon: TriangleAlert },
  { key: 'staff', label: 'Staff', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings2 },
] as const;
const EXTRA_SECTION_KEYS = ['profile'] as const;
const VALID_SECTION_KEYS = new Set<string>([
  ...SIDEBAR_SECTIONS.map((section) => section.key),
  ...EXTRA_SECTION_KEYS,
]);

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getFacilitySection(pathname: string) {
  if (!pathname.startsWith(FACILITY_BASE_PATH)) {
    return 'overview';
  }

  const next = pathname.slice(FACILITY_BASE_PATH.length).replace(/^\/+/, '');
  const candidate = next.split('/')[0] || 'overview';
  return VALID_SECTION_KEYS.has(candidate) ? candidate : 'overview';
}

function buildFacilityPath(section: string) {
  return `${FACILITY_BASE_PATH}/${section}`;
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {action ? <div className="sm:self-start">{action}</div> : null}
    </div>
  );
}

export default function FacilityIndex() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showCreateAppointmentDialog, setShowCreateAppointmentDialog] = useState(false);
  const [showInviteStaffDialog, setShowInviteStaffDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<FacilityAppointment | null>(null);
  const [appointmentAction, setAppointmentAction] = useState<{ id: number; action: 'edit' | 'cancel' | 'restore' } | null>(null);
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
  const [editAppointmentForm, setEditAppointmentForm] = useState({
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
  const currentSection = getFacilitySection(location.pathname);
  const minimumAppointmentDateTime = useMemo(() => formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)), []);
  const { connected } = useSocketStatus();

  useEffect(() => {
    if (location.pathname === FACILITY_BASE_PATH || !VALID_SECTION_KEYS.has(currentSection)) {
      navigate(buildFacilityPath('overview'), { replace: true });
    }
  }, [currentSection, location.pathname, navigate]);

  const loadStaff = useCallback(async () => {
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
  }, [facilityId]);

  const loadAppointments = useCallback(async () => {
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
  }, [facilityId]);

  const loadDashboard = useCallback(async () => {
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
  }, [facilityId]);

  const loadEscalations = useCallback(async () => {
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
  }, [facilityId]);

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await notificationService.list(20, true);
      setNotifications(response.notifications);
      setUnreadNotificationCount(response.unread_count);
    } catch {
      // Keep the dashboard usable if notifications fail.
    }
  }, []);

  const markNotificationRead = async (id: number) => {
    try {
      const response = await notificationService.markRead(id);
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
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
  }, [facilityId, loadAppointments, loadDashboard, loadEscalations, loadStaff, refreshNotifications]);

  useSocket<FacilityAppointment>(
    'facility:appointment_created',
    () => {
      if (facilityId) {
        loadAppointments();
        loadDashboard();
        refreshNotifications();
      }
    },
    { enabled: !!facilityId },
  );

  useSocket<FacilityAppointment>(
    'facility:appointment_updated',
    () => {
      if (facilityId) {
        loadAppointments();
        loadDashboard();
        refreshNotifications();
      }
    },
    { enabled: !!facilityId },
  );

  useSocket<{ facility_appointments?: FacilityAppointment[]; facility_escalations?: FacilityEscalation[] }>(
    'sync',
    (payload) => {
      if (payload.facility_appointments) {
        setAppointments(payload.facility_appointments);
      }
      if (payload.facility_escalations) {
        setEscalations(payload.facility_escalations);
      }
    },
    { enabled: !!facilityId },
  );

  useSocket<FacilityEscalation>(
    'facility:escalation_created',
    () => {
      if (facilityId) {
        loadEscalations();
        refreshNotifications();
      }
    },
    { enabled: !!facilityId },
  );

  useSocket<FacilityEscalation>(
    'facility:escalation_updated',
    () => {
      if (facilityId) {
        loadEscalations();
        refreshNotifications();
      }
    },
    { enabled: !!facilityId },
  );

  useSocket(
    'notification:new',
    () => {
      refreshNotifications();
    },
    { enabled: !!user?.id },
  );

  useSocket<{ staff?: FacilityStaffRecord[] }>(
    'facility:staff_update',
    (payload) => {
      if (payload.staff) {
        setStaff(payload.staff);
        setIsAdmin(payload.staff.some((member) => member.account_id === user?.id && member.role === 'admin' && member.status === 'active'));
      } else if (facilityId) {
        loadStaff();
      }
    },
    { enabled: !!facilityId },
  );

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
      setShowInviteStaffDialog(false);
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
      setShowCreateAppointmentDialog(false);
      loadAppointments();
      loadDashboard();
    } catch (error: unknown) {
      toast.error('Could not create appointment', { description: (error as Error).message });
    }
  };

  const openAppointmentEditor = (appointment: FacilityAppointment) => {
    setEditingAppointment(appointment);
    setEditAppointmentForm({
      scheduled_time: appointment.scheduled_time ? formatDateTimeLocal(new Date(appointment.scheduled_time)) : '',
      appointment_type: appointment.appointment_type || '',
      notes: appointment.notes || '',
    });
  };

  const updateAppointment = async () => {
    if (!facilityId || !editingAppointment) return;
    if (!editAppointmentForm.scheduled_time) {
      toast.error('Scheduled time is required');
      return;
    }

    setAppointmentAction({ id: editingAppointment.id, action: 'edit' });
    try {
      await facilityAppointmentService.updateAppointment(facilityId, editingAppointment.id, {
        scheduled_time: new Date(editAppointmentForm.scheduled_time).toISOString(),
        appointment_type: editAppointmentForm.appointment_type || undefined,
        notes: editAppointmentForm.notes || undefined,
      });
      toast.success('Appointment updated');
      setEditingAppointment(null);
      loadAppointments();
    } catch (error: unknown) {
      toast.error('Could not update appointment', { description: (error as Error).message });
    } finally {
      setAppointmentAction(null);
    }
  };

  const cancelAppointment = async (appointmentId: number) => {
    if (!facilityId) return;
    setAppointmentAction({ id: appointmentId, action: 'cancel' });
    try {
      await facilityAppointmentService.cancelAppointment(facilityId, appointmentId);
      toast.success('Appointment canceled');
      loadAppointments();
    } catch (error: unknown) {
      toast.error('Could not cancel appointment', { description: (error as Error).message });
    } finally {
      setAppointmentAction(null);
    }
  };

  const restoreAppointment = async (appointmentId: number) => {
    if (!facilityId) return;
    setAppointmentAction({ id: appointmentId, action: 'restore' });
    try {
      await facilityAppointmentService.restoreAppointment(facilityId, appointmentId);
      toast.success('Appointment restored');
      loadAppointments();
    } catch (error: unknown) {
      toast.error('Could not restore appointment', { description: (error as Error).message });
    } finally {
      setAppointmentAction(null);
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

  const appointmentSummary = useMemo(() => {
    const total = appointments.length;
    const assigned = appointments.filter((appointment) => appointment.status === 'assigned').length;
    const completed = appointments.filter((appointment) => appointment.status === 'completed').length;
    return { total, assigned, completed };
  }, [appointments]);

  const pendingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'scheduled' || appointment.status === 'assigned').length,
    [appointments],
  );

  const assignableStaff = useMemo(
    () => staff.filter((member) => member.account_id && member.status === 'active' && (member.role === 'doctor' || member.role === 'nurse')),
    [staff],
  );

  const goToSection = (section: string) => {
    setMobileSidebarOpen(false);
    navigate(buildFacilityPath(section));
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <Building2 className="h-4 w-4" />
        </div>
        {!sidebarCollapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Facility Dashboard</p>
            <p className="truncate text-xs text-white/65">{dashboard?.facility.name || 'Operations Center'}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {SIDEBAR_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = currentSection === section.key;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => goToSection(section.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                isActive
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
                sidebarCollapsed ? 'justify-center' : '',
              )}
              title={sidebarCollapsed ? section.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed ? <span className="truncate">{section.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSidebarCollapsed((value) => !value)}
          className={cn(
            'hidden w-full items-center gap-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white md:flex',
            sidebarCollapsed ? 'justify-center px-0' : 'justify-start px-3',
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!sidebarCollapsed ? <span>Collapse</span> : null}
        </Button>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Overview"
        description="A quick snapshot of your facility, team health, and active work."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Facility Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDashboard ? (
              <p className="text-sm text-muted-foreground">Loading facility details...</p>
            ) : (
              <>
                <p className="font-semibold line-clamp-1">{dashboard?.facility.name || 'Unknown Facility'}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {dashboard?.facility.address || dashboard?.facility.city || 'No address set'}
                </p>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p>{dashboard?.facility.phone || 'No phone configured'}</p>
                  <p>{dashboard?.facility.email || 'No email configured'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{dashboard?.stats.staff_count ?? staff.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Active team members ready for assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Appointment Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{appointmentSummary.total}</p>
            <p className="text-xs text-muted-foreground">
              {appointmentSummary.assigned} assigned, {appointmentSummary.completed} completed, {pendingAppointments} active
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Appointments"
        description="Manage facility appointments, assignments, and patient flow."
        action={
          isAdmin ? (
            <Dialog open={showCreateAppointmentDialog} onOpenChange={setShowCreateAppointmentDialog}>
              <DialogTrigger asChild>
                <Button>
                  <ClipboardPlus className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Appointment</DialogTitle>
                  <DialogDescription>Create a new facility appointment for a mother.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Mother Phone Number</Label>
                    <Input
                      value={appointmentForm.mother_phone_number}
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, mother_phone_number: event.target.value }))}
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
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, scheduled_time: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Input
                      value={appointmentForm.appointment_type}
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, appointment_type: event.target.value }))}
                      placeholder="ANC Visit"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={appointmentForm.notes}
                      onChange={(event) => setAppointmentForm((prev) => ({ ...prev, notes: event.target.value }))}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button onClick={createAppointment}>Create Appointment</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

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
                    {row.mother_response_status ? (
                      <p className="mt-2 text-xs font-medium text-primary/80">
                        Mother Response: {row.mother_response_status.replace(/_/g, ' ')}
                      </p>
                    ) : null}
                    {row.mother_response_note ? (
                      <p className="mt-1 text-xs text-muted-foreground">{row.mother_response_note}</p>
                    ) : null}
                    {row.ticket_code ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ticket Code: <span className="font-mono text-foreground">{row.ticket_code}</span>
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{row.status}</Badge>
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                        {row.assigned_staff_name || 'Unassigned'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {row.created_by_account_id === user?.id && row.status !== 'completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAppointmentEditor(row)}
                        disabled={appointmentAction !== null}
                      >
                        Edit
                      </Button>
                    ) : null}

                    {canAssign(row) ? (
                      <Button variant="outline" onClick={() => assignToMe(row.id)}>
                        Assign To Me
                      </Button>
                    ) : null}

                    {(row.status === 'scheduled' || row.status === 'assigned') && canUpdateStatus(row) ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(row.id, 'completed')}>
                          Complete
                        </Button>
                        {row.created_by_account_id === user?.id ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200"
                          onClick={() => cancelAppointment(row.id)}
                        >
                          {appointmentAction?.id === row.id && appointmentAction.action === 'cancel' ? 'Canceling...' : 'Cancel'}
                        </Button>
                        ) : null}
                      </>
                    ) : null}

                    {row.created_by_account_id === user?.id && row.status === 'canceled' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-200 text-green-700"
                        onClick={() => restoreAppointment(row.id)}
                        disabled={appointmentAction?.id === row.id && appointmentAction.action === 'restore'}
                      >
                        {appointmentAction?.id === row.id && appointmentAction.action === 'restore' ? 'Restoring...' : 'Restore'}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editingAppointment !== null} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Only the facility account that created this appointment can change it.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Scheduled Time</Label>
              <Input
                type="datetime-local"
                min={minimumAppointmentDateTime}
                value={editAppointmentForm.scheduled_time}
                onChange={(event) => setEditAppointmentForm((prev) => ({ ...prev, scheduled_time: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Input
                value={editAppointmentForm.appointment_type}
                onChange={(event) => setEditAppointmentForm((prev) => ({ ...prev, appointment_type: event.target.value }))}
                placeholder="ANC Visit"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={editAppointmentForm.notes}
                onChange={(event) => setEditAppointmentForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Optional notes"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAppointment(null)} disabled={appointmentAction?.action === 'edit'}>
                Cancel
              </Button>
              <Button onClick={updateAppointment} disabled={appointmentAction?.action === 'edit'}>
                {appointmentAction?.action === 'edit' ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderEscalations = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Escalations"
        description="Track facility escalations, assignments, and case progression."
      />
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
                    {isAdmin ? (
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
                    ) : null}

                    {(isAdmin || row.permissions?.can_update_status) && row.status !== 'checked_out' ? (
                      <>
                        {row.status === 'received' ? (
                          <Button size="sm" variant="outline" onClick={() => updateEscalationStatus(row.id, 'in_progress')}>
                            Start Progress
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => updateEscalationStatus(row.id, 'checked_out')}>
                          Check Out
                        </Button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Staff"
        description="Invite and manage facility team members from one place."
        action={
          isAdmin ? (
            <Dialog open={showInviteStaffDialog} onOpenChange={setShowInviteStaffDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Staff Member</DialogTitle>
                  <DialogDescription>Send an invitation to join this facility team.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 py-2">
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
                      onChange={(event) => setInviteForm((prev) => ({ ...prev, invitation_phone: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="staff@example.com"
                      value={inviteForm.invitation_email}
                      onChange={(event) => setInviteForm((prev) => ({ ...prev, invitation_email: event.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={inviteStaff}>Send Invitation</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

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
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
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
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Settings"
        description="Manage facility contact details and operating hours."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Facility Contact & Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input
              value={settingsForm.phone}
              onChange={(event) => setSettingsForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="+2547..."
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              value={settingsForm.email}
              onChange={(event) => setSettingsForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="facility@example.com"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1">
            <Label>Hours</Label>
            <Textarea
              value={settingsForm.hours_text}
              onChange={(event) => setSettingsForm((prev) => ({ ...prev, hours_text: event.target.value }))}
              placeholder="Mon-Fri 8:00 AM - 5:00 PM"
              disabled={!isAdmin}
            />
          </div>
          {isAdmin ? (
            <Button onClick={saveSettings}>Save Settings</Button>
          ) : (
            <p className="text-xs text-muted-foreground">Only facility admin can update settings.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Profile"
        description="Your facility account details and access information."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Facility Account Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
            <Button variant="outline" onClick={() => goToSection('settings')}>Manage Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const sectionContent = (() => {
    switch (currentSection) {
      case 'appointments':
        return renderAppointments();
      case 'escalations':
        return renderEscalations();
      case 'staff':
        return renderStaff();
      case 'settings':
        return renderSettings();
      case 'profile':
        return renderProfile();
      case 'overview':
      default:
        return renderOverview();
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className={cn('hidden border-r border-slate-200/80 md:flex md:flex-col', sidebarCollapsed ? 'w-20' : 'w-72')}>
          {sidebarContent}
        </aside>

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 sm:max-w-[280px]">
            <SheetTitle className="sr-only">Facility navigation</SheetTitle>
            <div className="h-full">{sidebarContent}</div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 min-w-0">
          <div className="app-shell-inner space-y-4 sm:space-y-5">
            <section className="dashboard-hero">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="md:hidden bg-white/15 text-white border-white/25 hover:bg-white/25"
                      onClick={() => setMobileSidebarOpen(true)}
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary-foreground/80">Facility Operations</p>
                      <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
                        {dashboard?.facility.name || 'Facility Staff Dashboard'}
                      </h1>
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
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <Badge variant="outline" className="border-white/35 text-white bg-transparent">
                      {connected ? (
                        <>
                          <span className="status-dot bg-emerald-400 mr-1.5" />
                          <Wifi className="mr-1 h-3.5 w-3.5" />
                          Live
                        </>
                      ) : (
                        <>
                          <span className="status-dot bg-red-400 mr-1.5" />
                          <WifiOff className="mr-1 h-3.5 w-3.5" />
                          Reconnecting
                        </>
                      )}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="relative bg-white/15 text-white border-white/25 hover:bg-white/25">
                          <Bell className="h-4 w-4" />
                          {unreadNotificationCount > 0 ? (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                              {unreadNotificationCount}
                            </span>
                          ) : null}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="flex items-center justify-between">
                          <span>Notifications</span>
                          {unreadNotificationCount > 0 ? (
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={markAllNotificationsRead}>
                              Mark all read
                            </Button>
                          ) : null}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.length === 0 ? (
                          <DropdownMenuItem className="text-muted-foreground">No notifications yet</DropdownMenuItem>
                        ) : null}
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
                      onProfile={() => goToSection('profile')}
                      onSettings={() => goToSection('settings')}
                      onLogout={logout}
                    />
                  </div>
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

            <section className="dashboard-tabs p-4 sm:p-5">
              {sectionContent}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
