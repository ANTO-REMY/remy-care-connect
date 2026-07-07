import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  RotateCcw,
  Ticket,
  User2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MotherFacilityAppointment } from "@/services/healthFacilityService";
import { RESPONSIVE_PADDING } from "@/components/ui/spacing.constants";

type FacilityBookingAction = "edit" | "cancel" | "restore" | null;

interface FacilityBookingCardProps {
  booking: MotherFacilityAppointment;
  actionInProgress?: FacilityBookingAction;
  onEdit: (booking: MotherFacilityAppointment) => void;
  onCancel: (booking: MotherFacilityAppointment) => void;
  onRestore: (booking: MotherFacilityAppointment) => void;
}

function titleize(value: string | null | undefined) {
  const text = (value || "").trim();
  if (!text) return "";
  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getFacilityBookingPurpose(booking: MotherFacilityAppointment) {
  const candidates = [
    booking.appointment_type,
    booking.notes,
  ];

  for (const candidate of candidates) {
    const text = titleize(candidate);
    if (text) return text;
  }

  return "Facility Appointment";
}

export function formatAppointmentDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";

  return new Date(value).toLocaleString("en-KE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBookingStatus(status: MotherFacilityAppointment["status"]) {
  return titleize(status) || "Scheduled";
}

function getStatusBadgeClass(status: MotherFacilityAppointment["status"]) {
  if (status === "scheduled" || status === "assigned") {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (status === "completed") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-gray-50 text-gray-600 border-gray-200";
}

function getTicketCode(booking: MotherFacilityAppointment) {
  return booking.ticket_code || "Pending";
}

export function FacilityBookingCard({
  booking,
  actionInProgress = null,
  onEdit,
  onCancel,
  onRestore,
}: FacilityBookingCardProps) {
  const [expanded, setExpanded] = useState(false);

  const purpose = useMemo(() => getFacilityBookingPurpose(booking), [booking]);
  const facilityLabel = booking.facility_name || `Facility #${booking.facility_id}`;
  const locationLabel = [booking.facility_address, booking.facility_city].filter(Boolean).join(", ");
  const isCanceled = booking.status === "canceled";
  const isCompleted = booking.status === "completed";
  const isEditable = !isCanceled && !isCompleted;

  return (
    <Card className={`transition-shadow hover:shadow-md ${isCanceled ? "opacity-80" : ""}`}>
      <CardContent className={RESPONSIVE_PADDING.card}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-primary/70" />
                <span className="truncate">Facility Booking</span>
              </div>
              <h4 className="mt-1 font-semibold text-base leading-tight break-words">{facilityLabel}</h4>
              <p className="mt-1 text-sm font-medium text-primary/90">{purpose}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatAppointmentDateTime(booking.scheduled_time)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Ticket className="h-3.5 w-3.5" />
                  <span className="font-mono text-foreground break-all">{getTicketCode(booking)}</span>
                </span>
              </div>
            </div>

            <Badge variant="outline" className={`whitespace-nowrap ${getStatusBadgeClass(booking.status)}`}>
              {formatBookingStatus(booking.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
              {expanded ? "Hide Details" : "View Details"}
            </Button>

            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onEdit(booking)}
                disabled={actionInProgress !== null}
              >
                {actionInProgress === "edit" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Pencil className="h-4 w-4 mr-1" />}
                Edit
              </Button>
            )}

            {isEditable && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => onCancel(booking)}
                disabled={actionInProgress !== null}
              >
                {actionInProgress === "cancel" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                Cancel
              </Button>
            )}

            {isCanceled && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => onRestore(booking)}
                disabled={actionInProgress !== null}
              >
                {actionInProgress === "restore" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
                Restore
              </Button>
            )}
          </div>

          {expanded && (
            <div className="rounded-xl border bg-slate-50/60 p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Facility</p>
                  <p className="mt-1 text-sm font-medium">{facilityLabel}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Purpose</p>
                  <p className="mt-1 text-sm">{purpose}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Appointment Time</p>
                  <p className="mt-1 text-sm">{formatAppointmentDateTime(booking.scheduled_time)}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-1 text-sm">{formatBookingStatus(booking.status)}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ticket Code</p>
                  <p className="mt-1 break-all font-mono text-sm">{getTicketCode(booking)}</p>
                </div>

                {booking.created_at && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="mt-1 text-sm">{formatAppointmentDateTime(booking.created_at)}</p>
                  </div>
                )}

                {locationLabel && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Facility Location</p>
                    <p className="mt-1 flex items-start gap-1 text-sm">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary/70" />
                      <span>{locationLabel}</span>
                    </p>
                  </div>
                )}

                {booking.assigned_staff_name && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned Staff</p>
                    <p className="mt-1 flex items-center gap-1 text-sm">
                      <User2 className="h-3.5 w-3.5 text-primary/70" />
                      {booking.assigned_staff_name}
                    </p>
                  </div>
                )}

                {booking.facility_hours_text && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Facility Hours</p>
                    <p className="mt-1 text-sm">{booking.facility_hours_text}</p>
                  </div>
                )}

                {booking.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes / Details</p>
                    <p className="mt-1 rounded-lg bg-white/90 p-3 text-sm text-slate-700">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
