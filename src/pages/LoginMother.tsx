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

    try {
      const success = await login(formData.phone, formData.pin, 'mother');
      
      if (success) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        navigate('/dashboard/mother');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid phone number or password.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
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
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+254 123 456 789"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
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

        {/* Quick Login for Demo */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Demo Mode - Quick Login Options:
          </p>
          <div className="space-y-1 text-xs text-center">
            <div>Phone: +254700000001 | Pass: demo123</div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}