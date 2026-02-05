import { useState } from 'react';
import { PinInput } from '@/components/PinInput';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function LoginMother() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    pin: ''
  });

  const handlePinChange = (val: string) => {
    setFormData({ ...formData, pin: val });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.phone || !formData.pin) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and password.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Phone number validation and normalization
    console.log('🔍 Validating phone:', formData.phone);
    console.log('🔍 Phone type:', typeof formData.phone);
    console.log('🔍 Phone value:', JSON.stringify(formData.phone));
    console.log('🔍 Phone length:', formData.phone?.length);
    
    const normalizedPhone = normalizePhoneNumber(formData.phone);
    console.log('📞 Normalized phone:', normalizedPhone);
    
    // TEMPORARILY DISABLE FRONTEND VALIDATION - let backend handle it
    // const isPhoneValid = validatePhoneNumber(formData.phone);
    // console.log('✅ Phone validation result:', isPhoneValid);
    
    // if (!isPhoneValid) {
    //   console.log('❌ Phone validation failed for:', formData.phone);
    //   toast({
    //     title: "Invalid phone number",
    //     description: "Please enter phone number in 07xxxxxxxx format (e.g., 0712345678)",
    //     variant: "destructive"
    //   });
    //   setIsLoading(false);
    //   return;
    // }
    
    console.log('✅ Phone validation passed (temporarily disabled)');

    // PIN validation
    if (formData.pin.length < 4 || formData.pin.length > 6 || !/^\d+$/.test(formData.pin)) {
      console.log('❌ PIN validation failed for:', formData.pin);
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4-6 digits",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    console.log('✅ PIN validation passed');

    try {
      console.log('🔑 Starting login process...');
      const result = await login(normalizedPhone, formData.pin);
      console.log('📋 Login result:', result);
      
      if (result.success) {
        console.log('✅ Login successful, navigating to dashboard');
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        
        // Use setTimeout to ensure state updates are processed
        setTimeout(() => {
          console.log('🚀 Navigating to /dashboard/mother');
          navigate('/dashboard/mother');
        }, 100);
        
      } else {
        console.log('❌ Login failed:', result.error);
        toast({
          title: "Login Failed",
          description: result.error || "Invalid phone number or PIN.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 Unexpected login error:', error);
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log('🏁 Login process finished');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
            <span className="text-2xl font-bold text-primary">RemyAfya</span>
          </Link>
          <h1 className="text-2xl font-bold text-primary mb-2">Welcome Back, Mother</h1>
          <p className="text-muted-foreground">
            Sign in to continue your maternal health journey
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register/mother" className="text-accent hover:underline font-medium">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>



        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}