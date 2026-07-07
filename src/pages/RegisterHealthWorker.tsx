import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserCheck,
} from "lucide-react";

import { FieldError } from "@/components/form/FieldError";
import { PinInput } from "@/components/PinInput";
import VerifyOTPModal from "@/components/VerifyOTPModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  countDigits,
  formatKenyanPhoneInput,
  getCursorFromDigitIndex,
  normalizePhoneNumber,
  validatePhoneNumber,
} from "@/lib/utils";
import healthFacilityService, {
  type HealthFacility,
  type WardFacilityMatchMode,
} from "@/services/healthFacilityService";
import { getSubCounties, getWards, type SubCounty, type Ward } from "@/services/locationService";
import { toast } from "@/components/ui/sonner";

type HealthWorkerFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  licenceNumber: string;
  wardId: number | null;
  pin: string;
  confirmPin: string;
};

type HealthWorkerField =
  | "firstName"
  | "lastName"
  | "phone"
  | "licenceNumber"
  | "subCounty"
  | "wardId"
  | "pin"
  | "confirmPin";

type HealthWorkerErrors = Partial<Record<HealthWorkerField, string>>;

const EMPTY_FORM: HealthWorkerFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  licenceNumber: "",
  wardId: null,
  pin: "",
  confirmPin: "",
};

const normalizeFacilityName = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export default function RegisterHealthWorker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, verifyOTP } = useAuth();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [showModal] = useState(false);
  const [selectedRole] = useState<"chw">("chw");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [formData, setFormData] = useState<HealthWorkerFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<HealthWorkerErrors>({});
  const [pinShake, setPinShake] = useState(false);
  const autoSubmitSignatureRef = useRef<string | null>(null);

  const [subCounties, setSubCounties] = useState<SubCounty[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedSubCountyId, setSelectedSubCountyId] = useState<number | null>(null);
  const [loadingSubCounties, setLoadingSubCounties] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [subCountyOpen, setSubCountyOpen] = useState(false);
  const [wardOpen, setWardOpen] = useState(false);

  const [linkedFacilities, setLinkedFacilities] = useState<HealthFacility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [facilityMatchMode, setFacilityMatchMode] = useState<WardFacilityMatchMode | null>(null);
  const [facilityQuery, setFacilityQuery] = useState("");
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newFacilityWardId, setNewFacilityWardId] = useState<number | null>(null);

  useEffect(() => {
    setLoadingSubCounties(true);
    getSubCounties()
      .then(setSubCounties)
      .catch(() => toast.error("Could not load sub-counties"))
      .finally(() => setLoadingSubCounties(false));
  }, []);

  useEffect(() => {
    if (!selectedSubCountyId) {
      setWards([]);
      return;
    }

    setLoadingWards(true);
    getWards(selectedSubCountyId)
      .then((nextWards) => {
        setWards(nextWards);
        if (nextWards.length > 0) {
          setWardOpen(true);
        }
      })
      .catch(() => toast.error("Could not load wards"))
      .finally(() => setLoadingWards(false));
  }, [selectedSubCountyId]);

  useEffect(() => {
    if (!formData.wardId) {
      setLinkedFacilities([]);
      setSelectedFacilityId(null);
      setFacilityMatchMode(null);
      setFacilityQuery("");
      setNewFacilityName("");
      setNewFacilityWardId(null);
      return;
    }

    let isMounted = true;
    setSelectedFacilityId(null);
    setLoadingFacilities(true);

    const loadFacilities = async () => {
      try {
        let response = await healthFacilityService.getFacilitiesByWard(formData.wardId!, {
          amenity: "hospital,clinic",
          relevance_profile: "maternal_referral",
          limit: 20,
        });

        if (response.facilities.length === 0) {
          response = await healthFacilityService.getFacilitiesByWard(formData.wardId!, {
            amenity: "hospital,clinic",
            relevance_profile: "all",
            limit: 20,
          });
        }

        if (!isMounted) return;

        setLinkedFacilities(response.facilities);
        setFacilityMatchMode(response.matched_by || null);
      } catch {
        if (!isMounted) return;
        toast.error("Could not load linked facilities");
        setLinkedFacilities([]);
        setFacilityMatchMode(null);
      } finally {
        if (isMounted) {
          setLoadingFacilities(false);
        }
      }
    };

    loadFacilities();

    return () => {
      isMounted = false;
    };
  }, [formData.wardId]);

  const subCountyItems = useMemo(
    () => subCounties.map((subCounty) => ({ value: String(subCounty.id), label: subCounty.name })),
    [subCounties]
  );

  const wardItems = useMemo(
    () => wards.map((ward) => ({ value: String(ward.id), label: ward.name })),
    [wards]
  );

  const facilityItems = useMemo(
    () =>
      linkedFacilities.map((facility) => ({
        value: String(facility.id),
        label: `${facility.name}${facility.ward_name ? ` - ${facility.ward_name}` : facility.city ? ` - ${facility.city}` : ""}`,
        keywords: [
          facility.amenity,
          facility.link_confidence ?? "",
          facility.city ?? "",
          facility.ward_name ?? "",
          facility.subcounty_name ?? "",
        ],
      })),
    [linkedFacilities]
  );
  const filteredWardItems = useMemo(
    () => wards.filter((ward) => ward.id !== formData.wardId).map((ward) => ({ value: String(ward.id), label: ward.name })),
    [formData.wardId, wards]
  );
  const selectedFacility = useMemo(
    () => linkedFacilities.find((facility) => facility.id === selectedFacilityId) ?? null,
    [linkedFacilities, selectedFacilityId]
  );
  const facilityQueryTrimmed = facilityQuery.trim();
  const normalizedFacilityQuery = normalizeFacilityName(facilityQueryTrimmed);
  const facilityNameExistsInScope = useMemo(
    () => linkedFacilities.some((facility) => normalizeFacilityName(facility.name) === normalizedFacilityQuery),
    [linkedFacilities, normalizedFacilityQuery]
  );
  const canAddNewFacility =
    Boolean(formData.wardId) &&
    Boolean(facilityQueryTrimmed) &&
    !selectedFacilityId &&
    !facilityNameExistsInScope &&
    normalizeFacilityName(newFacilityName) !== normalizedFacilityQuery;

  const validateForm = useCallback((): HealthWorkerErrors => {
    const nextErrors: HealthWorkerErrors = {};

    if (!formData.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!formData.phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (!validatePhoneNumber(formData.phone)) nextErrors.phone = "Use a valid Kenyan format like 0712 345 678.";
    if (!formData.licenceNumber.trim()) nextErrors.licenceNumber = "County CHW/CHP code is required.";
    if (!selectedSubCountyId) nextErrors.subCounty = "Choose your sub-county.";
    if (!formData.wardId) nextErrors.wardId = "Choose your ward.";
    if (formData.pin.length !== 4) nextErrors.pin = "PIN must be exactly 4 digits.";
    if (formData.confirmPin.length !== 4) nextErrors.confirmPin = "Confirm your 4-digit PIN.";
    else if (formData.pin !== formData.confirmPin) nextErrors.confirmPin = "PINs do not match yet.";

    return nextErrors;
  }, [formData, selectedSubCountyId]);

  const setFieldError = (field: HealthWorkerField, message?: string) => {
    setErrors((current) => {
      if (!message && !current[field]) return current;
      return { ...current, [field]: message };
    });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (name === "firstName" || name === "lastName" || name === "licenceNumber") {
      const label =
        name === "firstName" ? "First name" : name === "lastName" ? "Last name" : "County CHW/CHP code";
      setFieldError(name, value.trim() ? undefined : `${label} is required.`);
    }
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const digitsBeforeCursor = countDigits(input.value.slice(0, input.selectionStart ?? input.value.length));
    const formattedPhone = formatKenyanPhoneInput(input.value);

    setFormData((current) => ({ ...current, phone: formattedPhone }));
    setFieldError(
      "phone",
      formattedPhone && !validatePhoneNumber(formattedPhone)
        ? "Use a valid Kenyan format like 0712 345 678."
        : undefined
    );

    window.requestAnimationFrame(() => {
      const nextCursor = getCursorFromDigitIndex(formattedPhone, digitsBeforeCursor);
      phoneInputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSubCountyChange = (value: string) => {
    setSelectedSubCountyId(Number(value));
    setWardOpen(false);
    setFormData((current) => ({ ...current, wardId: null }));
    setSelectedFacilityId(null);
    setLinkedFacilities([]);
    setFacilityQuery("");
    setNewFacilityName("");
    setNewFacilityWardId(null);
    setFieldError("subCounty", undefined);
    setFieldError("wardId", undefined);
  };

  const handleWardChange = (value: string) => {
    const nextWardId = Number(value);
    setFormData((current) => ({ ...current, wardId: nextWardId }));
    setSelectedFacilityId(null);
    setFacilityQuery("");
    setNewFacilityName("");
    setNewFacilityWardId(null);
    setFieldError("wardId", undefined);
  };

  const handleExistingFacilityChange = (value: string) => {
    setSelectedFacilityId(Number(value));
    setNewFacilityName("");
    setNewFacilityWardId(null);
    setFacilityQuery("");
  };

  const handleAddFacility = () => {
    if (!facilityQueryTrimmed || !formData.wardId) {
      return;
    }
    if (facilityNameExistsInScope) {
      toast.info("Facility already exists", {
        description: "Please select the existing facility from the list instead of adding a new one.",
      });
      return;
    }

    setSelectedFacilityId(null);
    setNewFacilityName(facilityQueryTrimmed);
    setNewFacilityWardId(formData.wardId);
    toast.success("Facility will be submitted for approval", {
      description: "You can continue registration and we will mark this link as awaiting approval.",
    });
  };

  const clearPendingFacility = () => {
    setNewFacilityName("");
    setNewFacilityWardId(null);
    setFacilityQuery("");
  };

  const handlePinChange = (pin: string) => {
    setFormData((current) => ({ ...current, pin }));
    setFieldError("pin", pin.length === 4 ? undefined : "PIN must be exactly 4 digits.");
    if (formData.confirmPin) {
      setFieldError("confirmPin", pin === formData.confirmPin ? undefined : "PINs do not match yet.");
    }
  };

  const handleConfirmPinChange = (confirmPin: string) => {
    setFormData((current) => ({ ...current, confirmPin }));
    setFieldError(
      "confirmPin",
      confirmPin.length === 4
        ? confirmPin === formData.pin
          ? undefined
          : "PINs do not match yet."
        : "Confirm your 4-digit PIN."
    );
  };

  const facilityMatchLabel =
    facilityMatchMode === "inferred_ward"
      ? "Matched using inferred ward boundaries."
      : facilityMatchMode === "inferred_subcounty"
        ? "Matched by inferred sub-county fallback."
        : facilityMatchMode === "text_fallback"
          ? "Matched by city and name fallback."
          : null;

  const runSubmit = useCallback(async () => {
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (
      nextErrors.confirmPin === "PINs do not match yet." ||
      (formData.pin.length === 4 &&
        formData.confirmPin.length === 4 &&
        formData.pin !== formData.confirmPin)
    ) {
      setPinShake(true);
      setFormData((current) => ({
        ...current,
        pin: "",
        confirmPin: "",
      }));
      setTimeout(() => setPinShake(false), 320);
      return;
    }

    if (Object.values(nextErrors).some(Boolean)) {
      toast.warning("Please complete the highlighted fields.");
      return;
    }

    if (selectedFacilityId && !linkedFacilities.some((facility) => facility.id === selectedFacilityId)) {
      toast.warning("Please re-select a linked facility for the current ward.");
      return;
    }

    if (newFacilityName && !newFacilityWardId) {
      toast.warning("Choose the ward for the new facility submission.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        phone_number: normalizePhoneNumber(formData.phone),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        pin: formData.pin,
        role: selectedRole,
        email: formData.email.trim() || undefined,
        license_number: formData.licenceNumber.trim(),
        ward_id: formData.wardId,
        linked_facility_id: selectedFacilityId || undefined,
        new_facility_name: newFacilityName || undefined,
        new_facility_ward_id: newFacilityWardId || undefined,
      });

      if (result.success) {
        toast.success("Almost there!", {
          description: "We have sent a verification code to your phone.",
        });
        setShowVerify(true);
      } else {
        toast.error("Registration failed", {
          description: result.error || "A user with this phone number may already exist.",
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "We could not complete your registration. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, linkedFacilities, newFacilityName, newFacilityWardId, register, selectedFacilityId, selectedRole, validateForm]);

  useEffect(() => {
    if (formData.pin.length !== 4 || formData.confirmPin.length !== 4 || isLoading) {
      return;
    }

    const signature = `${formData.pin}:${formData.confirmPin}`;
    if (autoSubmitSignatureRef.current === signature) {
      return;
    }

    autoSubmitSignatureRef.current = signature;
    void runSubmit();
  }, [formData.confirmPin, formData.pin, isLoading, runSubmit]);

  useEffect(() => {
    if (formData.pin.length < 4 || formData.confirmPin.length < 4) {
      autoSubmitSignatureRef.current = null;
    }
  }, [formData.confirmPin.length, formData.pin.length]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await runSubmit();
  };

  if (showModal) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210_42%_96%)] via-[hsl(210_38%_98%)] to-[hsl(210_28%_92%)] px-3 py-6 sm:px-4">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
        <VerifyOTPModal
          open={showVerify}
          onOpenChange={setShowVerify}
          phoneNumber={normalizePhoneNumber(formData.phone)}
          onSubmit={async (otp) => {
            try {
              const result = await verifyOTP(normalizePhoneNumber(formData.phone), otp, {
                license_number: formData.licenceNumber,
                ward_id: formData.wardId,
                linked_facility_id: selectedFacilityId || undefined,
                new_facility_name: newFacilityName || undefined,
                new_facility_ward_id: newFacilityWardId || undefined,
              });
              return result.success;
            } catch {
              return false;
            }
          }}
          onResend={async () => {
            toast.info("Code resent", {
              description: "A new verification code has been sent to your phone.",
            });
          }}
          onVerified={() => {
            toast.success("Phone verified", {
              description: "Your account is ready. Please sign in.",
            });
            navigate(`/login/${selectedRole}`, { state: location.state });
          }}
        />

        <div className="w-full">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center space-x-2 transition-opacity hover:opacity-80">
              <span className="text-2xl font-bold text-primary">RemyAfya</span>
            </Link>
            <div className="mt-4 flex items-center justify-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Join as CHW</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Help mothers in your community thrive.
            </p>
          </div>

          <Card className="registration-card overflow-hidden rounded-[1.5rem] border-border/60">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Create Your Account</CardTitle>
              <CardDescription>Enter your details to get started with RemyAfya.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="group relative">
                      <User className="field-icon group-focus-within:text-accent" />
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                        autoComplete="given-name"
                        className="pl-10"
                        aria-invalid={errors.firstName ? "true" : undefined}
                      />
                    </div>
                    <FieldError message={errors.firstName} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <div className="group relative">
                      <User className="field-icon group-focus-within:text-accent" />
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        autoComplete="family-name"
                        className="pl-10"
                        aria-invalid={errors.lastName ? "true" : undefined}
                      />
                    </div>
                    <FieldError message={errors.lastName} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <div className="group relative">
                    <Mail className="field-icon group-focus-within:text-accent" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      autoComplete="email"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (07xxxxxxxx) *</Label>
                  <div className="group relative">
                    <Phone className="field-icon group-focus-within:text-accent" />
                    <Input
                      ref={phoneInputRef}
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="0712 345 678"
                      autoComplete="tel"
                      className="pl-10"
                      aria-invalid={errors.phone ? "true" : undefined}
                    />
                  </div>
                  <FieldError message={errors.phone} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenceNumber">County CHW/CHP Code *</Label>
                  <div className="group relative">
                    <Lock className="field-icon group-focus-within:text-accent" />
                    <Input
                      id="licenceNumber"
                      name="licenceNumber"
                      value={formData.licenceNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your county CHW/CHP code"
                      className="pl-10"
                      aria-invalid={errors.licenceNumber ? "true" : undefined}
                    />
                  </div>
                  <FieldError message={errors.licenceNumber} />
                </div>

                <div className="space-y-2">
                  <Label>Sub-County *</Label>
                  <div className="group relative">
                    <MapPin className="field-icon group-focus-within:text-accent" />
                    {loadingSubCounties ? (
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-card pl-10 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <SearchableCombobox
                        items={subCountyItems}
                        value={selectedSubCountyId ? String(selectedSubCountyId) : undefined}
                        onChange={handleSubCountyChange}
                        placeholder="Select sub-county"
                        searchPlaceholder="Search sub-counties..."
                        emptyMessage="No sub-county found."
                        invalid={Boolean(errors.subCounty)}
                        open={subCountyOpen}
                        onOpenChange={setSubCountyOpen}
                        triggerClassName="pl-10"
                      />
                    )}
                  </div>
                  <FieldError message={errors.subCounty} />
                </div>

                <div
                  className={`space-y-2 transition-all duration-300 ease-out ${
                    selectedSubCountyId ? "ward-shell-active" : "ward-shell-idle"
                  }`}
                >
                  <Label>Ward *</Label>
                  <div className="group relative">
                    <MapPin className="field-icon group-focus-within:text-accent" />
                    {loadingWards ? (
                      <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-card pl-10 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading wards...
                      </div>
                    ) : (
                      <SearchableCombobox
                        items={wardItems}
                        value={formData.wardId ? String(formData.wardId) : undefined}
                        onChange={handleWardChange}
                        placeholder={selectedSubCountyId ? "Select ward" : "Select sub-county first"}
                        searchPlaceholder="Search wards..."
                        emptyMessage="No ward found."
                        disabled={!selectedSubCountyId}
                        invalid={Boolean(errors.wardId)}
                        open={wardOpen}
                        onOpenChange={setWardOpen}
                        triggerClassName="pl-10"
                      />
                    )}
                  </div>
                  <FieldError message={errors.wardId} />
                </div>

                {loadingFacilities && (
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading linked facilities...
                  </div>
                )}

                {formData.wardId && (
                  <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3">
                    <Label>Linked Hospital or Clinic</Label>
                    <div className="group relative">
                      <Building2 className="field-icon group-focus-within:text-accent" />
                      <SearchableCombobox
                        items={facilityItems}
                        value={selectedFacilityId ? String(selectedFacilityId) : undefined}
                        onChange={handleExistingFacilityChange}
                        placeholder="Select or add facility (optional)"
                        searchPlaceholder="Search facilities..."
                        emptyMessage="No facility found in this sub-county."
                        triggerClassName="pl-10"
                        query={facilityQuery}
                        onQueryChange={setFacilityQuery}
                        displayValue={newFacilityName ? `${newFacilityName} (awaiting approval)` : undefined}
                        customActionLabel={canAddNewFacility ? `Add "${facilityQueryTrimmed}"` : undefined}
                        onCustomAction={canAddNewFacility ? handleAddFacility : undefined}
                      />
                    </div>
                    {facilityMatchLabel && <p className="text-xs text-muted-foreground">{facilityMatchLabel}</p>}
                    <p className="text-xs text-muted-foreground">
                      Search existing facilities in the same sub-county. If it is not listed, add it and we will mark it as awaiting approval.
                    </p>
                    {selectedFacility && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        Linked to existing facility: <span className="font-medium">{selectedFacility.name}</span>
                        {selectedFacility.ward_name ? ` in ${selectedFacility.ward_name}` : ""}
                      </div>
                    )}
                    {newFacilityName && (
                      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-amber-950">{newFacilityName}</p>
                            <p className="text-xs text-amber-900">
                              This facility will be submitted for approval before CHW-to-facility actions are enabled.
                            </p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={clearPendingFacility} className="h-8 px-2 text-amber-900">
                            Clear
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Facility Ward *</Label>
                          <SearchableCombobox
                            items={[
                              ...(formData.wardId
                                ? [{ value: String(formData.wardId), label: wards.find((ward) => ward.id === formData.wardId)?.name ?? "Selected ward" }]
                                : []),
                              ...filteredWardItems,
                            ]}
                            value={newFacilityWardId ? String(newFacilityWardId) : undefined}
                            onChange={(value) => setNewFacilityWardId(Number(value))}
                            placeholder="Select facility ward"
                            searchPlaceholder="Search facility wards..."
                            emptyMessage="No ward found."
                          />
                          <p className="text-xs text-amber-900">
                            Choose the ward where this facility is located. It must stay within the selected sub-county.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pin-0">PIN *</Label>
                  <div className={`flex items-center gap-3 ${pinShake ? "motion-safe:animate-shake" : ""}`}>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <PinInput value={formData.pin} onChange={handlePinChange} name="pin" label="PIN" required />
                  </div>
                  <FieldError message={errors.pin} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPin-0">Confirm PIN *</Label>
                  <div className={`flex items-center gap-3 ${pinShake ? "motion-safe:animate-shake" : ""}`}>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <PinInput
                      value={formData.confirmPin}
                      onChange={handleConfirmPinChange}
                      name="confirmPin"
                      label="Confirm PIN"
                      required
                    />
                  </div>
                  <FieldError message={errors.confirmPin} />
                </div>

                <Button type="submit" className="h-11 w-full rounded-xl" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to={`/login/${selectedRole}`} className="font-medium text-accent hover:underline">
                  Sign in here
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
