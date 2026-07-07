import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Lock, Mail, MapPin, Phone, User } from "lucide-react";

import { FieldError } from "@/components/form/FieldError";
import { PinInput } from "@/components/PinInput";
import VerifyOTPModal from "@/components/VerifyOTPModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useAuth } from "@/contexts/AuthContext";
import {
  countDigits,
  formatKenyanPhoneInput,
  getCursorFromDigitIndex,
  normalizePhoneNumber,
  validatePhoneNumber,
} from "@/lib/utils";
import { getSubCounties, getWards, type SubCounty, type Ward } from "@/services/locationService";
import { toast } from "@/components/ui/sonner";

type MotherFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dueDate: Date | undefined;
  dobDate: Date | undefined;
  weeksPregnant: string;
  wardId: number | null;
  pin: string;
  confirmPin: string;
};

type MotherField =
  | "firstName"
  | "lastName"
  | "phone"
  | "subCounty"
  | "wardId"
  | "dobDate"
  | "dueDate"
  | "pin"
  | "confirmPin";

type MotherErrors = Partial<Record<MotherField, string>>;

const EMPTY_FORM: MotherFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dueDate: undefined,
  dobDate: undefined,
  weeksPregnant: "",
  wardId: null,
  pin: "",
  confirmPin: "",
};

const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function RegisterMother() {
  const navigate = useNavigate();
  const { register, verifyOTP } = useAuth();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [dueDateMode, setDueDateMode] = useState<"date" | "weeks">("date");
  const [formData, setFormData] = useState<MotherFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<MotherErrors>({});
  const [pinShake, setPinShake] = useState(false);
  const autoSubmitSignatureRef = useRef<string | null>(null);

  const [subCounties, setSubCounties] = useState<SubCounty[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedSubCountyId, setSelectedSubCountyId] = useState<number | null>(null);
  const [loadingSubCounties, setLoadingSubCounties] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [subCountyOpen, setSubCountyOpen] = useState(false);
  const [wardOpen, setWardOpen] = useState(false);

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

  const subCountyItems = useMemo(
    () => subCounties.map((subCounty) => ({ value: String(subCounty.id), label: subCounty.name })),
    [subCounties]
  );

  const wardItems = useMemo(
    () =>
      wards.map((ward) => ({
        value: String(ward.id),
        label: ward.name,
      })),
    [wards]
  );

  const validateForm = (state: MotherFormState, subCountyId: number | null): MotherErrors => {
    const nextErrors: MotherErrors = {};

    if (!state.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!state.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!state.phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (!validatePhoneNumber(state.phone)) nextErrors.phone = "Use a valid Kenyan format like 0712 345 678.";
    if (!subCountyId) nextErrors.subCounty = "Choose your sub-county.";
    if (!state.wardId) nextErrors.wardId = "Choose your ward.";
    if (!state.dobDate) nextErrors.dobDate = "Date of birth is required.";
    if (!state.dueDate) nextErrors.dueDate = "Choose your due date or estimate it from weeks.";
    if (state.pin.length !== 4) nextErrors.pin = "PIN must be exactly 4 digits.";
    if (state.confirmPin.length !== 4) nextErrors.confirmPin = "Confirm your 4-digit PIN.";
    else if (state.pin !== state.confirmPin) nextErrors.confirmPin = "PINs do not match yet.";

    return nextErrors;
  };

  const setFieldError = (field: MotherField, message?: string) => {
    setErrors((current) => {
      if (!message && !current[field]) return current;
      return {
        ...current,
        [field]: message,
      };
    });
  };

  const handleTextInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "firstName" || name === "lastName") {
      setFieldError(name, value.trim() ? undefined : `${name === "firstName" ? "First" : "Last"} name is required.`);
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
    const nextSubCountyId = Number(value);
    setSelectedSubCountyId(nextSubCountyId);
    setWardOpen(false);
    setFormData((current) => ({
      ...current,
      wardId: null,
    }));
    setFieldError("subCounty", undefined);
    setFieldError("wardId", undefined);
  };

  const handleWardChange = (value: string) => {
    setFormData((current) => ({
      ...current,
      wardId: Number(value),
    }));
    setFieldError("wardId", undefined);
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

  const runSubmit = useCallback(async () => {
    const nextErrors = validateForm(formData, selectedSubCountyId);
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

    setIsLoading(true);

    try {
      const result = await register({
        phone_number: normalizePhoneNumber(formData.phone),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        pin: formData.pin,
        role: "mother",
        email: formData.email.trim() || undefined,
        dob: formData.dobDate ? formatDateLocal(formData.dobDate) : "",
        due_date: formData.dueDate ? formatDateLocal(formData.dueDate) : "",
        ward_id: formData.wardId,
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
  }, [formData, register, selectedSubCountyId]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210_42%_96%)] via-[hsl(210_38%_98%)] to-[hsl(210_28%_92%)] px-3 py-6 sm:px-4">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
        <VerifyOTPModal
          open={showVerify}
          onOpenChange={setShowVerify}
          phoneNumber={formData.phone}
          onSubmit={async (otp) => {
            try {
              const result = await verifyOTP(normalizePhoneNumber(formData.phone), otp, {
                dob: formData.dobDate ? formatDateLocal(formData.dobDate) : "",
                due_date: formData.dueDate ? formatDateLocal(formData.dueDate) : "",
                ward_id: formData.wardId,
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
            navigate("/login/mother");
          }}
        />

        <div className="w-full">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center space-x-2 transition-opacity hover:opacity-80">
              <span className="text-2xl font-bold text-primary">RemyAfya</span>
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-primary">Join as a Mother</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Start your journey with personalized maternal care.
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
                        onChange={handleTextInputChange}
                        placeholder="Jane"
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
                        onChange={handleTextInputChange}
                        placeholder="Wanjiru"
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
                      onChange={handleTextInputChange}
                      placeholder="jane@example.com"
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

                <div className="space-y-2">
                  <Label htmlFor="dobDate">Date of Birth *</Label>
                  <DatePicker
                    date={formData.dobDate}
                    setDate={(date) => {
                      setFormData((current) => ({ ...current, dobDate: date }));
                      setFieldError("dobDate", date ? undefined : "Date of birth is required.");
                    }}
                    placeholder="Select date of birth"
                  />
                  <FieldError message={errors.dobDate} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Due Date *</Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-accent transition-colors hover:text-primary"
                      onClick={() => {
                        setDueDateMode((current) => (current === "date" ? "weeks" : "date"));
                        setFormData((current) => ({
                          ...current,
                          weeksPregnant: "",
                          dueDate: undefined,
                        }));
                        setFieldError("dueDate", "Choose your due date or estimate it from weeks.");
                      }}
                    >
                      {dueDateMode === "date" ? "I don't know my due date" : "I know my due date"}
                    </button>
                  </div>

                  {dueDateMode === "date" ? (
                    <DatePicker
                      date={formData.dueDate}
                      setDate={(date) => {
                        setFormData((current) => ({ ...current, dueDate: date }));
                        setFieldError("dueDate", date ? undefined : "Choose your due date or estimate it from weeks.");
                      }}
                      placeholder="Select due date"
                    />
                  ) : (
                    <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3">
                      <Input
                        type="number"
                        min={1}
                        max={42}
                        placeholder="How many weeks pregnant are you? (1-42)"
                        value={formData.weeksPregnant}
                        onChange={(event) => {
                          const weeksPregnant = event.target.value;
                          const weeks = Number.parseInt(weeksPregnant, 10);
                          let dueDate: Date | undefined;

                          if (!Number.isNaN(weeks) && weeks >= 1 && weeks <= 42) {
                            const today = new Date();
                            dueDate = new Date(today.getTime() + (40 - weeks) * 7 * 24 * 60 * 60 * 1000);
                          }

                          setFormData((current) => ({
                            ...current,
                            weeksPregnant,
                            dueDate,
                          }));
                          setFieldError(
                            "dueDate",
                            dueDate ? undefined : "Enter a pregnancy estimate between 1 and 42 weeks."
                          );
                        }}
                        aria-invalid={errors.dueDate ? "true" : undefined}
                      />
                      {formData.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Estimated due date:{" "}
                          <span className="font-medium text-foreground">
                            {formData.dueDate.toLocaleDateString("en-KE", {
                              weekday: "short",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </p>
                      )}
                      <p className="text-xs italic text-muted-foreground">
                        If you are unsure, your CHW or nurse can help estimate this at your next visit.
                      </p>
                    </div>
                  )}
                  <FieldError message={errors.dueDate} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin-0">PIN *</Label>
                  <div className={`flex items-center gap-3 ${pinShake ? "motion-safe:animate-shake" : ""}`}>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <PinInput
                      value={formData.pin}
                      onChange={handlePinChange}
                      name="pin"
                      label="PIN"
                      required
                    />
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
                <Link to="/login/mother" className="font-medium text-accent hover:underline">
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
