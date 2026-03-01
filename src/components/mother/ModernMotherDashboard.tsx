/**
 * ModernMotherDashboard.tsx
 *
 * A GK-dashboard-inspired redesign of the mothers' view.
 * Color scheme  : dark charcoal/teal sidebar + bright teal accent (#14b8a6)
 * Charts        : pure SVG (no extra libraries)
 * Data source   : same real endpoints as EnhancedMotherDashboard
 *   • GET /mothers/me
 *   • GET /mothers/:id/checkins
 *   • GET /appointments?mother_id=:id
 *   • GET /photos/me   (profile photo)
 *
 * Route         : /dashboard/mother/modern   (separate; existing route untouched)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Baby, Bell, Calendar, ChevronRight, LogOut, User,
  Camera, Activity, TrendingUp, CheckCircle, AlertCircle,
  LayoutDashboard, ClipboardList, Heart, BookOpen, Settings,
  Plus, Loader2, Menu, X, ChevronLeft, ChevronDown,
  MoreVertical, ArrowUpRight, ArrowDownRight, Clock, Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { uploadPhoto, getPhotoFileUrl, getMyPhoto } from "@/services/photoService";
import { appointmentService, type Appointment } from "@/services/appointmentService";
import { motherService } from "@/services/motherService";
import { checkinService, type CheckIn } from "@/services/checkinService";
import { usePolling } from "@/hooks/usePolling";
import { useSocket, useSocketStatus } from "@/hooks/useSocket";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ─── colour tokens (inline so we don't touch tailwind.config) ───────────────
const SIDEBAR_BG   = "#0d2b2b";
const SIDEBAR_HOVER = "#163f3f";
const TEAL_ACC     = "#14b8a6";
const PAGE_BG      = "#f0f7f6";

// ─── helpers ─────────────────────────────────────────────────────────────────
function pregnancyWeekAndDays(dueDateStr: string): { week: number; daysLeft: number } {
  const due  = new Date(dueDateStr);
  const today = new Date();
  const daysLeft = Math.max(0, Math.round((due.getTime() - today.getTime()) / 86_400_000));
  const week    = Math.min(40, Math.max(1, 40 - Math.floor(daysLeft / 7)));
  return { week, daysLeft };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

// ─── SVG pie chart ────────────────────────────────────────────────────────────
interface PieSlice { label: string; value: number; color: string }
function PieChart({ slices, size = 160 }: { slices: PieSlice[]; size?: number }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 8} fill="#e5e7eb" />
        <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="12" fill="#6b7280">No data</text>
      </svg>
    );
  }
  const cx = size / 2, cy = size / 2, r = size / 2 - 8, ir = r * 0.55;
  let angle = -Math.PI / 2;
  const paths = slices.map((sl) => {
    const sweep = (sl.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const xi1 = cx + ir * Math.cos(angle);
    const yi1 = cy + ir * Math.sin(angle);
    const xi2 = cx + ir * Math.cos(angle + sweep);
    const yi2 = cy + ir * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${large} 0 ${xi1} ${yi1} Z`;
    angle += sweep;
    return { d, color: sl.color };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth={2} />
      ))}
    </svg>
  );
}

// ─── SVG line / area chart ────────────────────────────────────────────────────
interface LinePoint { label: string; value: number }
function LineChart({ points, width = 480, height = 160, color = TEAL_ACC }: {
  points: LinePoint[]; width?: number; height?: number; color?: string;
}) {
  if (points.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <text x={width / 2} y={height / 2} textAnchor="middle" fontSize="12" fill="#6b7280">
          Not enough data
        </text>
      </svg>
    );
  }
  const pad = { top: 12, right: 16, bottom: 28, left: 28 };
  const W = width  - pad.left - pad.right;
  const H = height - pad.top  - pad.bottom;
  const max = Math.max(...points.map(p => p.value), 1);
  const xs = points.map((_, i) => pad.left + (i / (points.length - 1)) * W);
  const ys = points.map(p => pad.top + H - (p.value / max) * H);
  const linePath = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${pad.top + H} L ${xs[0]} ${pad.top + H} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad.left} y1={pad.top + H * (1 - t)}
          x2={pad.left + W} y2={pad.top + H * (1 - t)}
          stroke="#e5e7eb" strokeWidth={1}
        />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#area-grad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={3.5} fill={color} stroke="white" strokeWidth={1.5} />
      ))}
      {/* X-labels */}
      {points.map((p, i) => (
        <text key={i} x={xs[i]} y={height - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Navigation items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview",      icon: LayoutDashboard, label: "Dashboard" },
  { id: "appointments",  icon: Calendar,        label: "Appointments" },
  { id: "checkins",      icon: ClipboardList,   label: "Check-ins" },
  { id: "health",        icon: Heart,           label: "Health" },
  { id: "education",     icon: BookOpen,        label: "Education" },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled:  { label: "Scheduled",  cls: "bg-teal-50 text-teal-700 border border-teal-200" },
    completed:  { label: "Completed",  cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    canceled:   { label: "Cancelled",  cls: "bg-red-50 text-red-700 border border-red-200" },
    cancelled:  { label: "Cancelled",  cls: "bg-red-50 text-red-700 border border-red-200" },
    rescheduled:{ label: "Rescheduled",cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

// ─── The main component ───────────────────────────────────────────────────────
export function ModernMotherDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── sidebar & nav ──
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [activeNav, setActiveNav]       = useState<NavId>("overview");

  // ── profile & photo ──
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profile, setProfile]           = useState<{ due_date?: string; id?: number } | null>(null);
  const [motherProfileId, setMotherProfileId] = useState<number | null>(null);
  const motherProfileIdRef = useRef<number | null>(null);

  // ── appointments ──
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading]   = useState(false);

  // ── check-ins ──
  const [checkins, setCheckins]         = useState<CheckIn[]>([]);
  const [checkinsLoading, setCheckinsLoading] = useState(false);

  // ── check-in modal ──
  const [showCheckInModal, setShowCheckInModal]   = useState(false);
  const [checkInSelected, setCheckInSelected]     = useState<"ok" | "not_ok" | null>(null);
  const [checkInComment, setCheckInComment]       = useState("");
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);

  // ── schedule appointment modal ──
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm]           = useState({
    scheduledTime: undefined as Date | undefined,
    appointmentType: "prenatal_checkup",
    notes: "",
  });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  // ── photo upload ──
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // ── notifications ──
  const [notifCount, setNotifCount] = useState(0);

  // ── derived pregnancy data ────────────────────────────────────────────────
  const { week: pregnancyWeek, daysLeft } = profile?.due_date
    ? pregnancyWeekAndDays(profile.due_date)
    : { week: 0, daysLeft: 0 };

  // ── stat counts ─────────────────────────────────────────────────────────
  const totalAppts      = appointments.length;
  const scheduledAppts  = appointments.filter(a => a.status === "scheduled").length;
  const totalCheckins   = checkins.length;
  const okCheckins      = checkins.filter(c => c.response === "ok").length;
  const notOkCheckins   = totalCheckins - okCheckins;

  // ── chart data: last 7 days of check-ins ──────────────────────────────────
  const checkinTrendPoints: LinePoint[] = (() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-KE", { weekday: "short" }).slice(0, 3);
      const dayStr = d.toISOString().slice(0, 10);
      const count = checkins.filter(c => c.created_at.startsWith(dayStr)).length;
      days.push({ label, value: count });
    }
    return days;
  })();

  const pieSlices: PieSlice[] = [
    { label: "Feeling Good", value: okCheckins,    color: TEAL_ACC },
    { label: "Needs Support", value: notOkCheckins, color: "#f43f5e" },
  ];

  // ── data loading ─────────────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const resp = await appointmentService.getAllForMother(user.id);
      setAppointments(resp.appointments);
    } catch { /* silent */ }

    if (motherProfileIdRef.current) {
      try {
        const resp = await checkinService.listForMother(motherProfileIdRef.current, 60);
        setCheckins(resp.checkins ?? []);
      } catch { /* silent */ }
    }
  }, [user?.id]);

  // WebSocket: real-time updates. Falls back to 5-min polling when disconnected.
  const { connected } = useSocketStatus();
  usePolling(refreshData, 300_000, !connected && !!user?.id);

  useSocket<Appointment>('appointment:created', (appt) => {
    // Avoid duplicates: only add if not already present (by ID)
    setAppointments(prev => prev.some(a => a.id === appt.id) ? prev : [appt, ...prev]);
  }, { enabled: !!user?.id });
  useSocket<Appointment>('appointment:updated', (appt) => setAppointments(prev => prev.map(a => a.id === appt.id ? appt : a)), { enabled: !!user?.id });
  useSocket<CheckIn>('checkin:new', (ci) => {
    // Avoid duplicates: only add if not already present (by ID)
    setCheckins(prev => prev.some(c => c.id === ci.id) ? prev : [ci, ...prev]);
  }, { enabled: !!user?.id });

  useEffect(() => {
    let alive = true;
    (async () => {
      // Profile photo
      try {
        const meta = await getMyPhoto();
        if (meta && alive) setProfileImage(getPhotoFileUrl(meta.file_url));
      } catch { /* ignore */ }

      // Mother profile
      try {
        const p = await motherService.getMyProfile();
        if (p?.id && alive) {
          setMotherProfileId(p.id);
          setProfile({ due_date: p.due_date, id: p.id });
          motherProfileIdRef.current = p.id;
        }
      } catch { /* ignore */ }

      // Initial spin
      if (alive) { setApptLoading(true); setCheckinsLoading(true); }
      await refreshData();
      if (alive) { setApptLoading(false); setCheckinsLoading(false); }
    })();
    return () => { alive = false; };
  }, [refreshData]);

  // Update notif count from pending checkins
  useEffect(() => {
    setNotifCount(appointments.filter(a => a.status === "scheduled").length);
  }, [appointments]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const meta = await uploadPhoto(file);
      setProfileImage(getPhotoFileUrl(meta.file_url));
      toast({ title: "Photo updated ✓" });
      setShowPhotoUpload(false);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCheckIn = async () => {
    if (!checkInSelected || !motherProfileId) return;
    setCheckInSubmitting(true);
    try {
      const c = await checkinService.create(motherProfileId, {
        response: checkInSelected,
        comment: checkInComment.trim() || undefined,
        channel: "app",
      });
      setCheckins(prev => [c, ...prev]);
      setShowCheckInModal(false);
      setCheckInSelected(null);
      setCheckInComment("");
      toast({
        title: checkInSelected === "ok" ? "Check-in recorded ✓" : "Check-in recorded",
        description: checkInSelected === "ok"
          ? "Keep taking care of yourself!"
          : "Your CHW has been notified.",
      });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setCheckInSubmitting(false);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!scheduleForm.scheduledTime) {
      toast({ title: "Pick a date & time", variant: "destructive" });
      return;
    }
    setScheduleSubmitting(true);
    try {
      const appt = await appointmentService.create({
        mother_id: user!.id,
        health_worker_id: user!.id,
        scheduled_time: scheduleForm.scheduledTime.toISOString(),
        appointment_type: scheduleForm.appointmentType,
        notes: scheduleForm.notes.trim() || undefined,
      });
      setAppointments(prev => [appt, ...prev]);
      toast({ title: "Appointment requested ✓", description: formatDate(appt.scheduled_time) });
      setShowScheduleModal(false);
      setScheduleForm({ scheduledTime: undefined, appointmentType: "prenatal_checkup", notes: "" });
    } catch (err: any) {
      toast({ title: "Scheduling failed", description: err.message, variant: "destructive" });
    } finally {
      setScheduleSubmitting(false);
    }
  };

  // ── recent 5 appointments ─────────────────────────────────────────────────
  const recentAppts = [...appointments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // ── recent check-ins for table ────────────────────────────────────────────
  const recentCheckins = checkins.slice(0, 6);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: PAGE_BG }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside
        className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-56" : "w-16"}`}
        style={{ background: SIDEBAR_BG }}
      >
        {/* Logo row */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: TEAL_ACC }}>
            <Baby className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-white text-sm tracking-wide truncate">RemyAfya</span>
          )}
          <button
            className="ml-auto text-white/60 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(o => !o)}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                  active
                    ? "text-white font-semibold"
                    : "text-white/60 hover:text-white/90"
                }`}
                style={active ? { background: TEAL_ACC } : { background: "transparent" }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: settings + logout */}
        <div className="px-2 pb-4 space-y-1 border-t border-white/10 pt-3">
          <button
            onClick={() => navigate("/dashboard/mother/profile")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white/90 transition-all text-left"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm truncate">Profile</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-rose-300 transition-all text-left"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SIDEBAR_HOVER; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP HEADER ─────────────────────────────────────────────── */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
            <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z" />
            </svg>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-500" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {notifCount}
                </span>
              )}
            </button>

            {/* User avatar */}
            <button
              onClick={() => navigate("/dashboard/mother/profile")}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            >
              <Avatar className="h-8 w-8 ring-2" style={{ "--tw-ring-color": TEAL_ACC } as React.CSSProperties}>
                <AvatarImage src={profileImage ?? undefined} />
                <AvatarFallback style={{ background: TEAL_ACC }} className="text-white text-sm font-semibold">
                  {user?.first_name?.[0]?.toUpperCase() ?? "M"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Mother</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
            </button>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ──────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Page heading */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {greeting}, {user?.first_name ?? "Mama"} 👋
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
                onClick={() => setShowCheckInModal(true)}
              >
                <Heart className="h-3.5 w-3.5" /> Daily Check-in
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-white"
                style={{ background: TEAL_ACC }}
                onClick={() => setShowScheduleModal(true)}
              >
                <Plus className="h-3.5 w-3.5" /> New Appointment
              </Button>
            </div>
          </div>

          {/* ── STAT CARDS ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Appointments */}
            <StatCard
              label="Total Appointments"
              value={apptLoading ? "—" : String(totalAppts)}
              sub={`${scheduledAppts} upcoming`}
              trend="up"
              icon={<Calendar className="h-5 w-5 text-white" />}
              accent="#14b8a6"
            />
            {/* Check-ins */}
            <StatCard
              label="Check-ins (30 days)"
              value={checkinsLoading ? "—" : String(totalCheckins)}
              sub={`${okCheckins} feeling good`}
              trend="up"
              icon={<ClipboardList className="h-5 w-5 text-white" />}
              accent="#8b5cf6"
            />
            {/* Pregnancy Week */}
            <StatCard
              label="Pregnancy Week"
              value={pregnancyWeek > 0 ? `Week ${pregnancyWeek}` : "—"}
              sub={`of 40 weeks`}
              trend="neutral"
              icon={<Baby className="h-5 w-5 text-white" />}
              accent="#f59e0b"
            />
            {/* Days to Due Date */}
            <StatCard
              label="Days to Due Date"
              value={daysLeft > 0 ? String(daysLeft) : "—"}
              sub={profile?.due_date ? formatDate(profile.due_date) : "Not set"}
              trend={daysLeft < 30 ? "warn" : "neutral"}
              icon={<Activity className="h-5 w-5 text-white" />}
              accent="#f43f5e"
            />
          </div>

          {/* ── CHARTS ROW ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Line chart – check-in trend */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">Check-in Activity</h3>
                  <p className="text-xs text-gray-400">Last 7 days</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${TEAL_ACC}18`, color: TEAL_ACC }}>
                  Daily
                </span>
              </div>
              <div className="overflow-x-auto">
                <LineChart points={checkinTrendPoints} width={480} height={160} color={TEAL_ACC} />
              </div>
            </div>

            {/* Pie chart – check-in distribution */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">Wellness Distribution</h3>
                <p className="text-xs text-gray-400">All-time check-ins</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <PieChart slices={pieSlices} size={150} />
                {/* Legend */}
                <div className="w-full space-y-2">
                  {pieSlices.map((sl) => {
                    const pct = totalCheckins > 0 ? Math.round((sl.value / totalCheckins) * 100) : 0;
                    return (
                      <div key={sl.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: sl.color }} />
                          <span className="text-gray-600 text-xs">{sl.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-800 text-xs">{sl.value}</span>
                          <span className="text-gray-400 text-xs">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── APPOINTMENTS TABLE + RECENT CHECK-INS ────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Appointments table */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Recent Appointments</h3>
                <button
                  className="text-xs font-medium flex items-center gap-1 hover:underline transition-colors"
                  style={{ color: TEAL_ACC }}
                  onClick={() => setActiveNav("appointments")}
                >
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {apptLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                </div>
              ) : recentAppts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No appointments yet
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppts.map((a, i) => (
                      <tr key={a.id} className={`border-t border-gray-50 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                        <td className="px-5 py-3 font-medium text-gray-700 truncate max-w-[140px]">
                          {(a.appointment_type ?? "Visit").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </td>
                        <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{formatDate(a.scheduled_time)}</td>
                        <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{formatTime(a.scheduled_time)}</td>
                        <td className="px-3 py-3 text-center"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent check-ins list */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Recent Check-ins</h3>
                <button
                  className="text-xs font-medium flex items-center gap-1 hover:underline"
                  style={{ color: TEAL_ACC }}
                  onClick={() => setActiveNav("checkins")}
                >
                  View all <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {checkinsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                </div>
              ) : recentCheckins.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No check-ins yet</div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {recentCheckins.map((c) => (
                    <li key={c.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                      <span
                        className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: c.response === "ok" ? `${TEAL_ACC}20` : "#fce7eb" }}
                      >
                        {c.response === "ok"
                          ? <CheckCircle className="h-3.5 w-3.5" style={{ color: TEAL_ACC }} />
                          : <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                        }
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700">
                          {c.response === "ok" ? "Feeling good" : "Needs support"}
                        </p>
                        {c.comment && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{c.comment}</p>
                        )}
                        <p className="text-[10px] text-gray-300 mt-0.5">
                          {formatDate(c.created_at)} {formatTime(c.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── QUICK ACTIONS STRIP ─────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Daily Check-in",         icon: <Heart className="h-5 w-5" />,        accent: TEAL_ACC,  action: () => setShowCheckInModal(true) },
              { label: "Book Appointment",        icon: <Calendar className="h-5 w-5" />,     accent: "#8b5cf6", action: () => setShowScheduleModal(true) },
              { label: "Update Photo",            icon: <Camera className="h-5 w-5" />,       accent: "#f59e0b", action: () => setShowPhotoUpload(true) },
              { label: "View Profile",            icon: <User className="h-5 w-5" />,         accent: "#3b82f6", action: () => navigate("/dashboard/mother/profile") },
            ].map(qa => (
              <button
                key={qa.label}
                onClick={qa.action}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${qa.accent}18`, color: qa.accent }}>
                  {qa.icon}
                </span>
                <span className="text-sm font-medium text-gray-700">{qa.label}</span>
              </button>
            ))}
          </div>

        </main>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}

      {/* Daily Check-in Modal */}
      <Dialog open={showCheckInModal} onOpenChange={(o) => { setShowCheckInModal(o); if (!o) { setCheckInSelected(null); setCheckInComment(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">How are you feeling today?</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Your response helps us monitor your health
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {([["ok", "Feeling Great!", "No concerns", "bg-teal-50 border-teal-200 hover:border-teal-400", "bg-teal-100 border-teal-500 ring-2 ring-teal-300", "text-teal-700"] ,
               ["not_ok", "Not Feeling Well", "Need support", "bg-rose-50 border-rose-200 hover:border-rose-400", "bg-rose-100 border-rose-500 ring-2 ring-rose-300", "text-rose-700"]] as const)
              .map(([val, title, sub, idle, active, textCls]) => (
                <button
                  key={val}
                  onClick={() => setCheckInSelected(val)}
                  className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${checkInSelected === val ? active : idle}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${checkInSelected === val ? "scale-110" : ""} transition-transform`}
                       style={{ background: checkInSelected === val ? (val === "ok" ? `${TEAL_ACC}30` : "#fce7eb") : "white" }}>
                    {val === "ok"
                      ? <CheckCircle className={`h-7 w-7 ${checkInSelected === val ? "" : "text-gray-400"}`} style={checkInSelected === val ? { color: TEAL_ACC } : {}} />
                      : <AlertCircle className={`h-7 w-7 ${checkInSelected === val ? "text-rose-500" : "text-gray-400"}`} />
                    }
                  </div>
                  <span className={`font-semibold text-sm ${checkInSelected === val ? textCls : "text-gray-600"}`}>{title}</span>
                  <span className={`text-xs mt-0.5 ${checkInSelected === val ? textCls : "text-gray-400"}`}>{sub}</span>
                </button>
              ))
            }
          </div>
          {checkInSelected && (
            <div className="space-y-3 pt-2">
              <Textarea
                placeholder="Add a note (optional)…"
                value={checkInComment}
                onChange={e => setCheckInComment(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
              <Button
                onClick={handleCheckIn}
                disabled={checkInSubmitting}
                className="w-full text-white"
                style={{ background: checkInSelected === "ok" ? TEAL_ACC : "#f43f5e" }}
              >
                {checkInSubmitting
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
                  : <><CheckCircle className="h-4 w-4 mr-2" />Submit Check-in</>
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Appointment Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>Request a visit with your assigned health worker.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Appointment Type</Label>
              <Select
                value={scheduleForm.appointmentType}
                onValueChange={v => setScheduleForm(f => ({ ...f, appointmentType: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["prenatal_checkup","antenatal_visit","postnatal_checkup","emergency","routine_visit","lab_test"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Date & Time</Label>
              <DateTimePicker
                date={scheduleForm.scheduledTime}
                setDate={d => setScheduleForm(f => ({ ...f, scheduledTime: d }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-gray-400">(optional)</span></Label>
              <Textarea
                placeholder="Describe your concern…"
                value={scheduleForm.notes}
                onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="resize-none text-sm"
              />
            </div>
            <Button
              onClick={handleScheduleAppointment}
              disabled={scheduleSubmitting || !scheduleForm.scheduledTime}
              className="w-full text-white"
              style={{ background: TEAL_ACC }}
            >
              {scheduleSubmitting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Booking…</>
                : "Confirm Appointment"
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Modal */}
      <Dialog open={showPhotoUpload} onOpenChange={setShowPhotoUpload}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Update Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileImage ?? undefined} />
              <AvatarFallback style={{ background: TEAL_ACC }} className="text-white text-2xl font-bold">
                {user?.first_name?.[0]?.toUpperCase() ?? "M"}
              </AvatarFallback>
            </Avatar>
            <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                   style={{ background: TEAL_ACC }}>
              <Camera className="h-4 w-4 inline mr-2" />
              Choose Photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <Button variant="outline" onClick={() => setShowPhotoUpload(false)}>Cancel</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── StatCard sub-component ───────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "neutral" | "warn";
  icon: React.ReactNode;
  accent: string;
}
function StatCard({ label, value, sub, trend, icon, accent }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
      {/* Icon bubble */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
          {trend === "down" && <ArrowDownRight className="h-3 w-3 text-rose-500" />}
          {trend === "warn" && <AlertCircle className="h-3 w-3 text-amber-500" />}
          <span className="text-xs text-gray-400 truncate">{sub}</span>
        </div>
      </div>
    </div>
  );
}
