import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, KeyRound, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PinInput } from '@/components/PinInput';
import { toast } from '@/components/ui/sonner';
import { apiClient } from '@/lib/apiClient';
import { initFirebaseMessaging } from '@/lib/firebaseClient';
import { normalizePhoneNumber, validatePhoneNumber } from '@/lib/utils';
import { featureFlags } from '@/lib/featureFlags';
import { useAuth, type User } from '@/contexts/AuthContext';
import {
  facilityStaffAuthService,
  type FacilityOTPLoginResponse,
  type FacilityPinLoginResponse,
  type FacilityProfileCompleteResponse,
} from '@/services/facilityStaffAuthService';

export default function LoginFacilityStaff() {
  const navigate = useNavigate();
  const { hydrateAuthSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requestingOTP, setRequestingOTP] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'otp' | 'pin'>('otp');
  const [requiresProfile, setRequiresProfile] = useState(false);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [pinLoginOtp, setPinLoginOtp] = useState('');
  const [awaitingPinOtp, setAwaitingPinOtp] = useState(false);
  const [contact, setContact] = useState({ phone_number: '', email: '' });
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    invited_phone_number: '',
    updated_phone_number: '',
    pin: '',
  });

  const resolveFacilityLandingPath = (nextUser?: User | null): string => {
    if (
      featureFlags.facilityNurseInheritance
      && nextUser?.role === 'facility_staff'
      && nextUser?.account_role === 'nurse'
    ) {
      return '/dashboard/nurse';
    }
    return '/dashboard/facility';
  };

  const normalizePhoneForRequest = (rawPhone?: string): string | undefined => {
    const trimmed = (rawPhone || '').trim();
    if (!trimmed) return undefined;

    if (!validatePhoneNumber(trimmed)) {
      toast.error('Invalid phone format', {
        description: 'Use 07xxxxxxxx for the support line.',
      });
      return undefined;
    }

    return normalizePhoneNumber(trimmed);
  };

  const requestOTP = async () => {
    const normalizedPhone = normalizePhoneForRequest(contact.phone_number);
    if (contact.phone_number && !normalizedPhone) {
      return;
    }

    setRequestingOTP(true);
    try {
      await facilityStaffAuthService.requestOTP({
        phone_number: normalizedPhone,
        email: contact.email || undefined,
      });
      toast.success('OTP sent', { description: 'Use the code to complete staff login.' });
    } catch (error: unknown) {
      toast.error('Could not issue OTP', { description: (error as Error).message });
    } finally {
      setRequestingOTP(false);
    }
  };

  const resendPinLoginOtp = async () => {
    const normalizedPhone = normalizePhoneForRequest(contact.phone_number);
    if (contact.phone_number && !normalizedPhone) {
      return;
    }

    if (!/^\d{4,8}$/.test(pin)) {
      toast.error('Invalid PIN', {
        description: 'PIN must contain 4 to 8 digits.',
      });
      return;
    }

    setLoading(true);
    try {
      const response: FacilityPinLoginResponse = await facilityStaffAuthService.pinLogin({
        pin,
        phone_number: normalizedPhone,
        email: contact.email || undefined,
      });

      if (response?.requires_otp) {
        setAwaitingPinOtp(true);
        toast.success('OTP resent', {
          description: response.message || 'Enter the latest OTP to finish PIN login.',
        });
      }
    } catch (error: unknown) {
      toast.error('Could not resend OTP', { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const loginWithOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhoneForRequest(contact.phone_number);
    if (contact.phone_number && !normalizedPhone) {
      return;
    }

    setLoading(true);
    try {
      const response: FacilityOTPLoginResponse = await facilityStaffAuthService.otpLogin({
        otp_code: otp,
        phone_number: normalizedPhone,
        email: contact.email || undefined,
      });

      apiClient.saveTokens(response.access_token, response.refresh_token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      hydrateAuthSession(response.user as User);

      try {
        await initFirebaseMessaging();
      } catch (error) {
        console.warn('[FCM] init failed for facility OTP login:', error);
      }

      if (response.requires_profile_completion) {
        setProfile((prev) => ({
          ...prev,
          first_name: response.user.first_name || prev.first_name,
          last_name: response.user.last_name || prev.last_name,
          email: response.user.email || prev.email,
          invited_phone_number: response.user.phone_number || contact.phone_number || prev.invited_phone_number,
          updated_phone_number: '',
        }));
        setRequiresProfile(true);
        toast.info('Complete profile to continue');
      } else {
        navigate(resolveFacilityLandingPath(response.user as User));
      }
    } catch (error: unknown) {
      toast.error('OTP login failed', { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const loginWithPin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedPhone = normalizePhoneForRequest(contact.phone_number);
    if (contact.phone_number && !normalizedPhone) {
      return;
    }

    if (!/^\d{4,8}$/.test(pin)) {
      toast.error('Invalid PIN', {
        description: 'PIN must contain 4 to 8 digits.',
      });
      return;
    }

    if (awaitingPinOtp && pinLoginOtp.length !== 5) {
      toast.error('OTP required', {
        description: 'Enter the 5-digit OTP to complete PIN login.',
      });
      return;
    }

    setLoading(true);
    try {
      const response: FacilityPinLoginResponse = await facilityStaffAuthService.pinLogin({
        pin,
        otp_code: awaitingPinOtp ? pinLoginOtp : undefined,
        phone_number: normalizedPhone,
        email: contact.email || undefined,
      });

      if (response?.requires_otp) {
        setAwaitingPinOtp(true);
        toast.success('OTP sent', {
          description: response.message || 'Enter the OTP to complete PIN login.',
        });
        return;
      }

      apiClient.saveTokens(response.access_token, response.refresh_token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      if (response.user) {
        hydrateAuthSession(response.user as User);
      }

      try {
        await initFirebaseMessaging();
      } catch (error) {
        console.warn('[FCM] init failed for facility PIN login:', error);
      }

      if (response.requires_profile_completion && response.user) {
        setProfile((prev) => ({
          ...prev,
          first_name: response.user.first_name || prev.first_name,
          last_name: response.user.last_name || prev.last_name,
          email: response.user.email || prev.email,
          invited_phone_number: response.user.phone_number || contact.phone_number || prev.invited_phone_number,
          updated_phone_number: '',
        }));
        setRequiresProfile(true);
        toast.info('Complete profile to continue');
        return;
      }

      toast.success('Welcome back');
      navigate(resolveFacilityLandingPath(response.user as User));
    } catch (error: unknown) {
      toast.error('PIN login failed', { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async () => {
    const normalizedUpdatedPhone = normalizePhoneForRequest(profile.updated_phone_number);
    if (profile.updated_phone_number && !normalizedUpdatedPhone) {
      return;
    }

    if (!/^\d{4,8}$/.test(profile.pin)) {
      toast.error('Invalid PIN', {
        description: 'PIN must contain 4 to 8 digits.',
      });
      return;
    }

    setLoading(true);
    try {
      const response: FacilityProfileCompleteResponse = await facilityStaffAuthService.completeProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email || undefined,
        updated_phone_number: normalizedUpdatedPhone,
        pin: profile.pin,
      });
      sessionStorage.setItem('user', JSON.stringify(response.user));
      hydrateAuthSession(response.user as User);

      try {
        await initFirebaseMessaging();
      } catch (error) {
        console.warn('[FCM] init failed for facility profile completion:', error);
      }

      toast.success('Profile completed');
      navigate(resolveFacilityLandingPath(response.user as User));
    } catch (error: unknown) {
      toast.error('Profile update failed', { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-shell-inner grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.4fr] lg:gap-6 lg:items-start">
        <section className="dashboard-hero">
          <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
            <Building2 className="h-4 w-4" />
            Facility Access Portal
          </div>
          <h1 className="mt-3 text-xl sm:text-2xl font-semibold leading-tight">Join your facility team securely</h1>
          <p className="mt-2 text-sm sm:text-base text-primary-foreground/85">
            Doctors and nurses can join with invitation OTP, then use PIN for fast secure access.
          </p>

          <div className="mt-4 space-y-2 text-sm">
            <div className="dashboard-glass px-3 py-2 text-primary-foreground/95">1. Request OTP with email or phone</div>
            <div className="dashboard-glass px-3 py-2 text-primary-foreground/95">2. Verify invitation and set profile details</div>
            <div className="dashboard-glass px-3 py-2 text-primary-foreground/95">3. Continue with PIN on future logins</div>
          </div>
        </section>

        <Card className="dashboard-glass border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Staff Login
            </CardTitle>
            <CardDescription>Use OTP for first access, then PIN for quick return login.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Support Line (optional)</Label>
              <div className="relative">
                <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone_number"
                  className="pl-10"
                  value={contact.phone_number}
                  onChange={(e) => setContact((prev) => ({
                    ...prev,
                    phone_number: e.target.value.replace(/\D/g, '').slice(0, 10),
                  }))}
                  placeholder="0712345678"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (optional if phone used)</Label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  className="pl-10"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as 'otp' | 'pin')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="otp">OTP Login</TabsTrigger>
                <TabsTrigger value="pin">PIN Login</TabsTrigger>
              </TabsList>

              <TabsContent value="otp" className="space-y-3 mt-3">
                <Button variant="outline" className="w-full" onClick={requestOTP} disabled={requestingOTP || (!contact.phone_number && !contact.email)}>
                  {requestingOTP ? 'Requesting OTP...' : 'Request OTP'}
                </Button>

                <Button variant="ghost" className="w-full" onClick={requestOTP} disabled={requestingOTP || (!contact.phone_number && !contact.email)}>
                  {requestingOTP ? 'Resending OTP...' : 'Resend OTP'}
                </Button>

                <form className="space-y-3" onSubmit={loginWithOTP}>
                  <div className="space-y-2">
                    <Label htmlFor="otp_login-0">OTP Code</Label>
                    <div className="flex justify-center">
                      <PinInput
                        value={otp}
                        onChange={setOtp}
                        name="otp_login"
                        label="OTP Code"
                        required
                        length={5}
                        visuallyHiddenLabel
                      />
                    </div>
                  </div>
                  <Button className="w-full" disabled={loading} type="submit">
                    {loading ? 'Signing in...' : 'Sign In With OTP'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="pin" className="space-y-3 mt-3">
                <form className="space-y-3" onSubmit={loginWithPin}>
                  <div className="space-y-2">
                    <Label htmlFor="pin_login-0">PIN</Label>
                    <div className="flex justify-center">
                      <PinInput
                        value={pin}
                        onChange={setPin}
                        name="pin_login"
                        label="PIN"
                        required
                        length={4}
                        visuallyHiddenLabel
                      />
                    </div>
                  </div>

                  {awaitingPinOtp && (
                    <div className="space-y-2">
                      <Label htmlFor="pin_login_otp-0">OTP Code</Label>
                      <div className="flex justify-center">
                        <PinInput
                          value={pinLoginOtp}
                          onChange={setPinLoginOtp}
                          name="pin_login_otp"
                          label="OTP Code"
                          required
                          length={5}
                          visuallyHiddenLabel
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">Enter the 5-digit OTP sent to your support line.</p>
                    </div>
                  )}

                  <Button className="w-full" disabled={loading} type="submit">
                    {loading ? (awaitingPinOtp ? 'Verifying OTP...' : 'Requesting OTP...') : (awaitingPinOtp ? 'Verify OTP & Sign In' : 'Continue With PIN')}
                  </Button>
                </form>
                {awaitingPinOtp && (
                  <Button variant="ghost" className="w-full" onClick={resendPinLoginOtp} disabled={loading} type="button">
                    {loading ? 'Resending OTP...' : 'Resend OTP'}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">Use OTP mode if this is your first login or if PIN is not set.</p>
              </TabsContent>
            </Tabs>

            {requiresProfile && (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Complete your profile</h3>
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="mr-1 h-3 w-3" /> First login
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="First name"
                    value={profile.first_name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, first_name: e.target.value }))}
                  />
                  <Input
                    placeholder="Last name"
                    value={profile.last_name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, last_name: e.target.value }))}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    placeholder="Invitation phone number"
                    value={profile.invited_phone_number || contact.phone_number}
                    readOnly
                    disabled
                  />
                  <Input
                    placeholder="Change phone number (optional)"
                    value={profile.updated_phone_number}
                    onChange={(e) => setProfile((prev) => ({
                      ...prev,
                      updated_phone_number: e.target.value.replace(/\D/g, '').slice(0, 10),
                    }))}
                    inputMode="numeric"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  If you enter a new number, it becomes your primary login OTP number. Leaving it empty keeps your current invitation number.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="profile_pin-0">Create PIN</Label>
                  <div className="flex justify-center">
                    <PinInput
                      value={profile.pin}
                      onChange={(val) => setProfile((prev) => ({ ...prev, pin: val }))}
                      name="profile_pin"
                      label="Create PIN"
                      required
                      length={4}
                      visuallyHiddenLabel
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={completeProfile} disabled={loading || !profile.first_name || !profile.last_name || !profile.pin}>
                  Save Profile
                </Button>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Are you claiming a facility? <Link className="text-primary hover:underline" to="/register/facility-admin">Register as admin</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
