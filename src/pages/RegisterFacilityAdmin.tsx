import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Building2, Loader2, Mail, MapPin, Phone, Search, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PinInput } from '@/components/PinInput';
import { toast } from '@/components/ui/sonner';
import { apiClient } from '@/lib/apiClient';
import { normalizePhoneNumber, validatePhoneNumber } from '@/lib/utils';
import { getSubCounties, getWards, SubCounty, Ward } from '@/services/locationService';
import {
  ClaimableFacility,
  facilityStaffAuthService,
} from '@/services/facilityStaffAuthService';

export default function RegisterFacilityAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingSubCounties, setLoadingSubCounties] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  const [subCounties, setSubCounties] = useState<SubCounty[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [facilities, setFacilities] = useState<ClaimableFacility[]>([]);
  const [facilityEmptyState, setFacilityEmptyState] = useState<{ title: string; message: string } | null>(null);

  const [amenityFilter, setAmenityFilter] = useState<'hospital,clinic' | 'hospital' | 'clinic' | 'pharmacy'>('hospital,clinic');
  const [facilitySearch, setFacilitySearch] = useState('');

  const [form, setForm] = useState({
    sub_county_id: '',
    ward_id: '',
    facility_id: '',
    phone_number: '',
    first_name: '',
    last_name: '',
    email: '',
    pin: '',
  });

  useEffect(() => {
    setLoadingSubCounties(true);
    getSubCounties()
      .then(setSubCounties)
      .catch(() => toast.error('Could not load sub-counties'))
      .finally(() => setLoadingSubCounties(false));
  }, []);

  useEffect(() => {
    if (!form.sub_county_id) {
      setWards([]);
      setFacilities([]);
      setForm((prev) => ({ ...prev, ward_id: '', facility_id: '' }));
      return;
    }

    setLoadingWards(true);
    getWards(Number(form.sub_county_id))
      .then((data) => {
        setWards(data);
      })
      .catch(() => {
        toast.error('Could not load wards');
        setWards([]);
      })
      .finally(() => setLoadingWards(false));
  }, [form.sub_county_id]);

  useEffect(() => {
    if (!form.sub_county_id || !form.ward_id) {
      setFacilities([]);
      setFacilityEmptyState(null);
      setForm((prev) => ({ ...prev, facility_id: '' }));
      return;
    }

    const relevanceProfile = amenityFilter === 'hospital,clinic' || amenityFilter === 'hospital' || amenityFilter === 'clinic'
      ? 'maternal_referral'
      : 'all';

    setLoadingFacilities(true);
    facilityStaffAuthService
      .listClaimableFacilities({
        sub_county_id: Number(form.sub_county_id),
        ward_id: Number(form.ward_id),
        amenity: amenityFilter,
        relevance_profile: relevanceProfile,
        limit: 80,
      })
      .then((response) => {
        setFacilities(response.facilities);
        setFacilityEmptyState(response.empty_state || null);
        if (response.facilities.length === 0) {
          toast.warning(response.empty_state?.title || 'No unclaimed facilities found for this ward', {
            description: response.empty_state?.message,
          });
        }
      })
      .catch((error: unknown) => {
        toast.error('Could not load facilities', {
          description: (error as Error).message || 'Please try again.',
        });
        setFacilities([]);
        setFacilityEmptyState(null);
      })
      .finally(() => setLoadingFacilities(false));
  }, [form.sub_county_id, form.ward_id, amenityFilter]);

  const visibleFacilities = useMemo(() => {
    const query = facilitySearch.trim().toLowerCase();
    if (!query) return facilities;

    return facilities.filter((facility) => {
      const haystack = [facility.name, facility.city, facility.address, facility.amenity, facility.healthcare]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [facilities, facilitySearch]);

  const selectedFacility = visibleFacilities.find((facility) => String(facility.id) === form.facility_id)
    || facilities.find((facility) => String(facility.id) === form.facility_id)
    || null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.facility_id) {
      toast.error('Select a facility to claim first');
      return;
    }

    if (!validatePhoneNumber(form.phone_number)) {
      toast.error('Invalid support line', {
        description: 'Use 07xxxxxxxx format.',
      });
      return;
    }

    if (!/^\d{4,8}$/.test(form.pin)) {
      toast.error('Invalid PIN', {
        description: 'PIN must contain 4 to 8 digits.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await facilityStaffAuthService.registerFacilityAdmin({
        facility_id: Number(form.facility_id),
        phone_number: normalizePhoneNumber(form.phone_number),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || undefined,
        pin: form.pin,
      });

      apiClient.saveTokens(response.access_token, response.refresh_token);
      sessionStorage.setItem('user', JSON.stringify(response.user));

      toast.success('Facility admin account created');
      navigate('/dashboard/facility');
    } catch (error: unknown) {
      toast.error('Registration failed', {
        description: (error as Error).message || 'Please verify your details and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-shell-inner">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-6 lg:items-start">
          <section className="dashboard-hero">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-xs text-primary-foreground/95">
              <Sparkles className="h-3.5 w-3.5" />
              Facility Claim & Verification
            </div>
            <h1 className="mt-3 text-xl sm:text-2xl font-semibold leading-tight">Register as a Facility Admin</h1>
            <p className="mt-2 text-sm sm:text-base text-primary-foreground/85">
              Choose your sub-county, then ward, then claim the matching facility in your service area.
            </p>

            <div className="mt-4 space-y-2 text-sm text-primary-foreground/95">
              <div className="dashboard-glass px-3 py-2">Step 1: Pick sub-county and ward.</div>
              <div className="dashboard-glass px-3 py-2">Step 2: Select facility from filtered results.</div>
              <div className="dashboard-glass px-3 py-2">Step 3: Create admin account and start inviting staff.</div>
            </div>
          </section>

          <Card className="dashboard-glass border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Admin Registration
              </CardTitle>
              <CardDescription>
                Claim your facility with guided location-based selection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Sub-County</Label>
                    {loadingSubCounties ? (
                      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading sub-counties...
                      </div>
                    ) : (
                      <Select
                        value={form.sub_county_id}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, sub_county_id: value, ward_id: '', facility_id: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub-county" />
                        </SelectTrigger>
                        <SelectContent>
                          {subCounties.map((subCounty) => (
                            <SelectItem key={subCounty.id} value={String(subCounty.id)}>{subCounty.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Ward</Label>
                    {loadingWards ? (
                      <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading wards...
                      </div>
                    ) : (
                      <Select
                        value={form.ward_id}
                        onValueChange={(value) => setForm((prev) => ({ ...prev, ward_id: value, facility_id: '' }))}
                        disabled={!form.sub_county_id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={form.sub_county_id ? 'Select ward' : 'Select sub-county first'} />
                        </SelectTrigger>
                        <SelectContent>
                          {wards.map((ward) => (
                            <SelectItem key={ward.id} value={String(ward.id)}>{ward.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Facility Type Filter</Label>
                    <Select
                      value={amenityFilter}
                      onValueChange={(value: 'hospital,clinic' | 'hospital' | 'clinic' | 'pharmacy') => setAmenityFilter(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospital,clinic">Hospitals & Clinics</SelectItem>
                        <SelectItem value="hospital">Hospitals only</SelectItem>
                        <SelectItem value="clinic">Clinics only</SelectItem>
                        <SelectItem value="pharmacy">Pharmacies only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facility-search">Search Facility Results</Label>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="facility-search"
                        className="pl-10"
                        placeholder="Filter by name or area"
                        value={facilitySearch}
                        onChange={(e) => setFacilitySearch(e.target.value)}
                        disabled={facilities.length === 0}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Facility To Claim</Label>
                  {loadingFacilities ? (
                    <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading facilities in selected ward...
                    </div>
                  ) : form.ward_id && visibleFacilities.length === 0 ? (
                    <div className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {facilityEmptyState?.title || 'No unclaimed facilities found for this ward'}
                      </p>
                      <p className="mt-1">
                        {facilityEmptyState?.message || 'Try searching by facility name, or contact support if your facility should appear here.'}
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={form.facility_id}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, facility_id: value }))}
                      disabled={!form.ward_id || visibleFacilities.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.ward_id ? 'Choose facility' : 'Select ward first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleFacilities.map((facility) => (
                          <SelectItem key={facility.id} value={String(facility.id)}>
                            {facility.name}{facility.city ? ` - ${facility.city}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">Showing {visibleFacilities.length} claimable facilities.</p>
                </div>

                {selectedFacility && (
                  <div className="rounded-lg border bg-background/70 p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{selectedFacility.name}</p>
                      {selectedFacility.verified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="outline">Unverified</Badge>}
                    </div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedFacility.city || selectedFacility.address || 'Location not specified'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Facility ID: {selectedFacility.id} • Type: {selectedFacility.amenity || selectedFacility.healthcare || 'general'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={form.first_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={form.last_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Support Line</Label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone_number"
                      className="pl-10"
                      value={form.phone_number}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        phone_number: e.target.value.replace(/\D/g, '').slice(0, 10),
                      }))}
                      placeholder="0712345678"
                      inputMode="numeric"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      className="pl-10"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facility_admin_pin-0">PIN</Label>
                  <PinInput
                    value={form.pin}
                    onChange={(val) => setForm((prev) => ({ ...prev, pin: val }))}
                    name="facility_admin_pin"
                    label="PIN"
                    required
                    visuallyHiddenLabel
                  />
                  <Badge variant="outline" className="text-xs">
                    <BadgeCheck className="mr-1 h-3 w-3" /> Secure PIN login enabled
                  </Badge>
                </div>

                <Button className="w-full" disabled={loading || !form.facility_id} type="submit">
                  {loading ? 'Creating account...' : 'Create Facility Admin Account'}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground mt-4 text-center">
                Already have access? <Link className="text-primary hover:underline" to="/login/facility">Staff login</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
