import { useState } from 'react';
import { PinInput } from '@/components/PinInput';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { normalizePhoneNumber } from '@/lib/utils';

export default function LoginMother() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ phone: '', pin: '' });

    const handlePinChange = (val: string) => setFormData({ ...formData, pin: val });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!formData.phone || !formData.pin) {
            toast.warning('Missing information', {
                description: 'Please enter your phone number and PIN before signing in.',
            });
            setIsLoading(false);
            return;
        }

        if (formData.pin.length < 4 || formData.pin.length > 6 || !/^\d+$/.test(formData.pin)) {
            toast.error('Invalid PIN', {
                description: 'Your PIN must be between 4 and 6 digits.',
            });
            setIsLoading(false);
            return;
        }

        try {
            const normalizedPhone = normalizePhoneNumber(formData.phone);
            const result = await login(normalizedPhone, formData.pin);

            if (result.success) {
                toast.success('Welcome back! 💚', {
                    description: "You've signed in successfully. Loading your dashboard…",
                });
                // Navigate based on the actual role returned by the backend
                if (result.role === 'mother') {
                    navigate('/dashboard/mother');
                } else if (result.role === 'chw') {
                    navigate('/dashboard/chw');
                } else if (result.role === 'nurse') {
                    navigate('/dashboard/nurse');
                } else {
                    navigate('/dashboard/mother');
                }
            } else {
                toast.error('Sign in failed', {
                    description: result.error || 'Incorrect phone number or PIN. Please double-check and try again.',
                });
            }
        } catch (error) {
            toast.error('Connection problem', {
                description: 'We could not reach the server. Please check your internet connection and try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-accent/5 to-primary/5 flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity">
                        <span className="text-2xl font-bold text-primary">RemyAfya</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-primary mb-2">Welcome Back, Mother</h1>
                    <p className="text-muted-foreground">Sign in to continue your maternal health journey</p>
                </div>

                <Card>
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl">Sign In</CardTitle>
                        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <div className="space-y-2">
                                <Label htmlFor="pin-0">PIN *</Label>
                                <div className="flex justify-center items-center gap-3">
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                    <PinInput value={formData.pin} onChange={handlePinChange} name="pin" label="PIN" required />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Signing In…' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm">
                            <span className="text-muted-foreground">Don't have an account? </span>
                            <Link to="/register/mother" className="text-accent hover:underline font-medium">Register here</Link>
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
