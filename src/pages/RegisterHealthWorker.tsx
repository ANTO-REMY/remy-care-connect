import { useState, useEffect } from 'react';
import { PinInput } from '@/components/PinInput';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, User, Phone, Lock, UserCheck, Loader2, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import VerifyOTPModal from '@/components/VerifyOTPModal';
import { normalizePhoneNumber, validatePhoneNumber } from '@/lib/utils';
import { getSubCounties, getWards, SubCounty, Ward } from '@/services/locationService';
import healthFacilityService, { HealthFacility, type WardFacilityMatchMode } from '@/services/healthFacilityService';

export default function RegisterHealthWorker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, verifyOTP } = useAuth();
  // CHW-only registration (nurse role removed)
  const [showModal, setShowModal] = useState(false); // Modal not used when navigating from landing
  const [selectedRole] = useState<'chw'>('chw');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    licenceNumber: '',
    wardId: null as number | null,
    pin: '',
    confirmPin: ''
  });

  // Location state
  const [subCounties, setSubCounties] = useState<SubCounty[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedSubCountyId, setSelectedSubCountyId] = useState<number | null>(null);
  const [loadingSubCounties, setLoadingSubCounties] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  
  // Linked facilities state
  const [linkedFacilities, setLinkedFacilities] = useState<HealthFacility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [facilityMatchMode, setFacilityMatchMode] = useState<WardFacilityMatchMode | null>(null);

  useEffect(() => {
    setLoadingSubCounties(true);
    getSubCounties()
      .then(setSubCounties)
      .catch(() => toast.error('Could not load sub-counties'))
      .finally(() => setLoadingSubCounties(false));
  }, []);

  useEffect(() => {
    if (!selectedSubCountyId) { setWards([]); setFormData(f => ({ ...f, wardId: null })); return; }
    setLoadingWards(true);
    getWards(selectedSubCountyId)
      .then(setWards)
      .catch(() => toast.error('Could not load wards'))
      .finally(() => setLoadingWards(false));
  }, [selectedSubCountyId]);

  // Load linked facilities when ward is selected
  useEffect(() => {
    if (!formData.wardId) {
      setLinkedFacilities([]);
      setSelectedFacilityId(null);
      setFacilityMatchMode(null);
      return;
    }

    let isMounted = true;
    setSelectedFacilityId(null);
    setLoadingFacilities(true);

    const loadFacilities = async () => {
      try {
        let response = await healthFacilityService.getFacilitiesByWard(formData.wardId!, {
          amenity: 'hospital,clinic',
          relevance_profile: 'maternal_referral',
          limit: 20
        });

        if (response.facilities.length === 0) {
          response = await healthFacilityService.getFacilitiesByWard(formData.wardId!, {
            amenity: 'hospital,clinic',
            relevance_profile: 'all',
            limit: 20
          });
        }

        if (!isMounted) return;

        setLinkedFacilities(response.facilities);
        setFacilityMatchMode(response.matched_by || null);
        if (response.facilities.length > 0) {
          toast.success(`Found ${response.facilities.length} facilities in your area`);
        }
      } catch {
        if (!isMounted) return;
        toast.error('Could not load linked facilities');
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

  const facilityMatchLabel =
    facilityMatchMode === 'inferred_ward'
      ? 'Matched using inferred ward boundaries (highest confidence).'
      : facilityMatchMode === 'inferred_subcounty'
        ? 'Matched by inferred sub-county fallback (medium confidence).'
        : facilityMatchMode === 'text_fallback'
          ? 'Matched by city/name fallback (lower confidence).'
          : null;

  const handleConfirmPinChange = (val: string) => {
    setFormData({ ...formData, confirmPin: val });
  };


  const handlePinChange = (val: string) => {
    setFormData({ ...formData, pin: val });
  };

  const handleRoleSelect = (role: 'chw') => {
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.licenceNumber || !formData.pin || !formData.wardId) {
      toast.warning('Missing information', {
        description: 'Please fill in all required fields before creating your account.',
      });
      setIsLoading(false);
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      toast.error('Invalid phone number', {
        description: 'Please enter a valid Kenyan phone number (e.g. 0712345678).',
      });
      setIsLoading(false);
      return;
    }

    const normalizedPhone = normalizePhoneNumber(formData.phone);

    if (selectedFacilityId && !linkedFacilities.some((facility) => facility.id === selectedFacilityId)) {
      toast.warning('Please re-select a linked facility for the current ward.');
      setIsLoading(false);
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      toast.error('PINs do not match', {
        description: 'Make sure both PIN fields are identical before continuing.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await register({
        phone_number: normalizedPhone,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        pin: formData.pin,
        role: selectedRole,
        email: formData.email.trim() || undefined,
        license_number: formData.licenceNumber,
        ward_id: formData.wardId,
        linked_facility_id: selectedFacilityId || undefined,
      });

      if (result.success) {
        toast.success('Almost there! 🎉', {
          description: "We've sent a verification code to your phone. Please check your messages.",
        });
        setShowVerify(true);
      } else {
        toast.error('Registration failed', {
          description: result.error || 'A user with this phone number may already exist. Try logging in instead.',
        });
      }
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'We could not complete your registration. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (showModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-3 sm:p-4 my-4">
        <Dialog open={showModal} onOpenChange={() => navigate('/')}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Choose Your Role</DialogTitle>
              <DialogDescription className="text-center">
                Select which type of health worker you are
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={() => handleRoleSelect('chw')}
                variant="outline"
                className="w-full h-auto p-6 flex flex-col items-center space-y-2 hover:bg-primary/5"
              >
                <UserCheck className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <div className="font-semibold">Community Health Worker</div>
                  <div className="text-sm text-muted-foreground">Work directly with mothers in the community</div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-3 sm:p-4 my-4">
      <div className="w-full max-w-md">
        <VerifyOTPModal
          open={showVerify}
          onOpenChange={setShowVerify}
          phoneNumber={normalizePhoneNumber(formData.phone)}
          onSubmit={async (otp) => {
            try {
              const result = await verifyOTP(
                normalizePhoneNumber(formData.phone),
                otp,
                {
                  license_number: formData.licenceNumber,
                  ward_id: formData.wardId,
                  linked_facility_id: selectedFacilityId || undefined,
                }
              );
              return result.success;
            } catch (error) {
              return false;
            }
          }}
          onResend={async () => {
            toast.info('Code resent', {
              description: 'A new verification code has been sent to your phone.',
            });
          }}
          onVerified={() => {
            toast.success('Phone verified! ✅', {
              description: 'Your account is ready. Please sign in with your credentials.',
            });
            navigate(`/login/${selectedRole}`);
          }}
        />
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold text-primary">RemyAfya</span>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <UserCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Join as CHW</h1>
          </div>
          <p className="text-muted-foreground">
            Help mothers in your community thrive
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Create Your Account</CardTitle>
            <CardDescription>
              Enter your details to get started with RemyAfya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name row: First + Last side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Kamau"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email (optional) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (07xxxxxxxx) *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0712345678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {/* Licence number */}
              <div className="space-y-2">
                <Label htmlFor="licenceNumber">Licence Number *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="licenceNumber"
                    name="licenceNumber"
                    type="text"
                    placeholder="Enter your licence number"
                    value={formData.licenceNumber}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Location: Sub-County + Ward */}
              <div className="space-y-2">
                <Label>Sub-County *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  {loadingSubCounties ? (
                    <div className="flex items-center gap-2 pl-10 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : (
                    <Select
                      value={selectedSubCountyId?.toString() ?? ''}
                      onValueChange={(v) => setSelectedSubCountyId(Number(v))}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select sub-county" />
                      </SelectTrigger>
                      <SelectContent>
                        {subCounties.map((sc) => (
                          <SelectItem key={sc.id} value={sc.id.toString()}>{sc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ward *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  {loadingWards ? (
                    <div className="flex items-center gap-2 pl-10 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                    </div>
                  ) : (
                    <Select
                      value={formData.wardId?.toString() ?? ''}
                      onValueChange={(v) => {
                        setSelectedFacilityId(null);
                        setFormData({ ...formData, wardId: Number(v) });
                      }}
                      disabled={!selectedSubCountyId}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder={selectedSubCountyId ? 'Select ward' : 'Select sub-county first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((w) => (
                          <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Linked Hospital/Clinic Selection */}
              {linkedFacilities.length > 0 && (
                <div className="space-y-2">
                  <Label>Linked Hospital/Clinic</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={selectedFacilityId?.toString() ?? ''}
                      onValueChange={(v) => setSelectedFacilityId(Number(v))}
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select referral facility (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {linkedFacilities.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id.toString()}>
                            {facility.name} {facility.city ? `- ${facility.city}` : ''} ({facility.amenity})
                            {facility.link_confidence ? ` • ${facility.link_confidence} confidence` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {facilityMatchLabel && (
                    <p className="text-xs text-muted-foreground">{facilityMatchLabel}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Select a facility for patient referrals in your area
                  </p>
                </div>
              )}

              {loadingFacilities && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading linked facilities...
                </div>
              )}

              {/* PIN */}
              <div className="space-y-2">
                <Label htmlFor="pin-0">PIN *</Label>
                <div className="flex justify-center items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <PinInput
                    value={formData.pin}
                    onChange={handlePinChange}
                    name="pin"
                    label="PIN"
                    required
                  />
                </div>
              </div>

              {/* Confirm PIN */}
              <div className="space-y-2">
                <Label htmlFor="confirm-pin-0">Confirm PIN *</Label>
                <div className="flex justify-center items-center gap-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <PinInput
                    value={formData.confirmPin}
                    onChange={handleConfirmPinChange}
                    name="confirmPin"
                    label="Confirm PIN"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link
                to={`/login/${selectedRole}`}
                className="text-accent hover:underline font-medium"
              >
                Sign in here
              </Link>
            </div>


          </CardContent>
        </Card>

      </div >
    </div >
  );
}