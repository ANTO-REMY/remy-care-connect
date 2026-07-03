import { useEffect, useState } from "react";
import { AlertTriangle, Building2, MapPin, Navigation, Phone, Mail, Clock3 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HealthFacility, ReportIssueData } from "@/services/healthFacilityService";

interface FacilityDetailModalProps {
  facility: HealthFacility | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportIssue: (data: ReportIssueData) => Promise<void>;
  onBookAppointment: (data: { scheduled_time: string; appointment_type?: string; notes?: string }) => Promise<void>;
  reporting: boolean;
  booking: boolean;
}

const ISSUE_TYPES: Array<{ value: ReportIssueData["issue_type"]; label: string }> = [
  { value: "closed", label: "Facility is Closed" },
  { value: "wrong_location", label: "Wrong Location" },
  { value: "wrong_name", label: "Wrong Name" },
  { value: "wrong_info", label: "Wrong Information" },
  { value: "other", label: "Other Issue" },
];

const MIN_APPOINTMENT_LEAD_TIME_MS = 60 * 60 * 1000;

function getMinimumBookingDateTime() {
  return new Date(Date.now() + MIN_APPOINTMENT_LEAD_TIME_MS);
}

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function FacilityDetailModal({
  facility,
  open,
  onOpenChange,
  onReportIssue,
  onBookAppointment,
  reporting,
  booking,
}: FacilityDetailModalProps) {
  const [issueType, setIssueType] = useState<ReportIssueData["issue_type"]>("other");
  const [description, setDescription] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("prenatal_checkup");
  const [bookingNotes, setBookingNotes] = useState("");
  const [minimumBookingDateTime, setMinimumBookingDateTime] = useState(() => getMinimumBookingDateTime());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMinimumBookingDateTime(getMinimumBookingDateTime());
    }, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const minimumBookingValue = formatDateTimeLocal(minimumBookingDateTime);
  const isScheduledTimeValid = scheduledTime ? new Date(scheduledTime) >= minimumBookingDateTime : false;

  useEffect(() => {
    if (!open) {
      setIssueType("other");
      setDescription("");
      setScheduledTime("");
      setAppointmentType("prenatal_checkup");
      setBookingNotes("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {facility?.name || "Facility Details"}
          </DialogTitle>
          <DialogDescription>
            Review facility information and report any incorrect details.
          </DialogDescription>
        </DialogHeader>

        {facility && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {facility.amenity || facility.healthcare || "health facility"}
                </Badge>
                {typeof facility.distance_km === "number" && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    <Navigation className="h-3 w-3 mr-1" />
                    {facility.distance_km.toFixed(1)} km away
                  </Badge>
                )}
                {facility.verified && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Verified</Badge>
                )}
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {facility.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{facility.city}</span>
                  </div>
                )}
                {facility.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{facility.address}</span>
                  </div>
                )}
                {facility.metadata?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{String(facility.metadata.phone)}</span>
                  </div>
                )}
                {facility.metadata?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{String(facility.metadata.email)}</span>
                  </div>
                )}
                {facility.metadata?.hours_text && (
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    <span>{String(facility.metadata.hours_text)}</span>
                  </div>
                )}
              </div>
            </div>

            {(facility.issues?.total || 0) > 0 && (
              <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 text-sm text-amber-900">
                <p className="font-medium">Community-reported issues</p>
                <p>
                  {facility.issues?.open || 0} open of {facility.issues?.total || 0} total reports.
                </p>
              </div>
            )}

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">Book Appointment At This Facility</h4>

              <div className="space-y-2">
                <Label>Preferred Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledTime}
                  min={minimumBookingValue}
                  step={60}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (!nextValue) {
                      setScheduledTime("");
                      return;
                    }
                    setScheduledTime(nextValue < minimumBookingValue ? minimumBookingValue : nextValue);
                  }}
                />
                <p className="text-xs text-muted-foreground">Bookings must be at least 1 hour from now.</p>
              </div>

              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select value={appointmentType} onValueChange={setAppointmentType}>
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
                <Label>Booking Notes (optional)</Label>
                <Textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Symptoms, preferred timing, or extra details"
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                disabled={booking || !scheduledTime || !isScheduledTimeValid}
                onClick={async () => {
                  await onBookAppointment({
                    scheduled_time: new Date(scheduledTime).toISOString(),
                    appointment_type: appointmentType,
                    notes: bookingNotes.trim() || undefined,
                  });
                }}
              >
                {booking ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="font-medium">Report an Issue</h4>
              </div>

              <div className="space-y-2">
                <Label>Issue Type</Label>
                <Select value={issueType} onValueChange={(value) => setIssueType(value as ReportIssueData["issue_type"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((issue) => (
                      <SelectItem key={issue.value} value={issue.value}>
                        {issue.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what is incorrect or missing"
                  rows={4}
                />
              </div>

              <Button
                className="w-full"
                disabled={reporting || description.trim().length < 5}
                onClick={async () => {
                  await onReportIssue({
                    issue_type: issueType,
                    description: description.trim(),
                  });
                }}
              >
                {reporting ? "Submitting..." : "Submit Issue Report"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
