/**
 * OnboardingModal â€” 2-step modal for mothers on first login.
 *
 * Step 1 : Upload a profile photo  (optional â€” can skip)
 * Step 2 : Next-of-kin details     (required â€” cannot skip)
 *
 * Location (sub-county + ward) is captured at registration, NOT here.
 *
 * The modal has NO close button and ignores backdrop / Escape key clicks.
 * Only after both steps succeed does it call onComplete().
 */

import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadPhoto } from '@/services/photoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import {
    Camera,
    Upload,
    User,
    Phone,
    Heart,
    CheckCircle2,
    ArrowRight,
    Loader2,
} from 'lucide-react';

interface NextOfKinData {
    name: string;
    phone: string;
    sex: string;
    relationship: string;
}

interface OnboardingModalProps {
    open: boolean;
    onComplete: () => void;
}

const RELATIONSHIPS = [
    'Husband / Partner',
    'Mother',
    'Father',
    'Sister',
    'Brother',
    'Aunt',
    'Uncle',
    'Friend',
    'Other',
];

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
    const { user, markOnboardingComplete } = useAuth();

    // â”€â”€â”€ Step tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [step, setStep] = useState<1 | 2>(1);

    // â”€â”€â”€ Step 1: Photo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoUploaded, setPhotoUploaded] = useState(false);

    // â”€â”€â”€ Step 2: Next of Kin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [nokData, setNokData] = useState<NextOfKinData>({
        name: '',
        phone: '',
        sex: '',
        relationship: '',
    });
    const [savingNok, setSavingNok] = useState(false);

    // â”€â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            toast.error('Invalid file type', {
                description: 'Please upload a JPG, PNG, or WebP image.',
            });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large', {
                description: 'Maximum allowed size is 5 MB.',
            });
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setPhotoUploaded(false);
    };

    const handleUploadPhoto = async () => {
        if (!selectedFile) return;
        setUploadingPhoto(true);
        try {
            await uploadPhoto(selectedFile);
            setPhotoUploaded(true);
            toast.success('Photo uploaded! ðŸŽ‰', {
                description: 'Your profile photo has been saved.',
            });
        } catch (err: any) {
            toast.error('Upload failed', {
                description: err.message || 'Could not upload photo. Please try again.',
            });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleNextToStep2 = () => {
        if (!photoUploaded) {
            toast.info('Photo optional', {
                description: 'You can add a profile photo later from your dashboard.',
            });
        }
        setStep(2);
    };

    const handleNokChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNokData({ ...nokData, [e.target.name]: e.target.value });
    };

    const handleFinish = async () => {
        if (!nokData.name.trim() || !nokData.phone.trim() || !nokData.relationship || !nokData.sex) {
            toast.warning('All fields required', {
                description: 'Please fill in all next-of-kin details.',
            });
            return;
        }

        setSavingNok(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'}/nextofkin`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: nokData.name.trim(),
                        phone: nokData.phone.trim(),
                        sex: nokData.sex,
                        relationship: nokData.relationship,
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || err.message || 'Failed to save next-of-kin');
            }

            toast.success("You're all set! ðŸŒŸ", {
                description: 'Your profile is complete. Welcome to RemyAfya!',
            });

            markOnboardingComplete();
            onComplete();
        } catch (err: any) {
            toast.error('Could not save next-of-kin', {
                description: err.message || 'Please try again.',
            });
        } finally {
            setSavingNok(false);
        }
    };

    // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return (
        <Dialog
            open={open}
            onOpenChange={() => {
                /* intentionally blocked â€” cannot close without completing */
            }}
        >
            <DialogContent
                className="sm:max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                style={{ '--dialog-close-display': 'none' } as React.CSSProperties}
            >
                {/* â”€â”€ Progress indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                        {photoUploaded && step === 2 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                    </div>
                    <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
                    <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${step === 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                    >
                        2
                    </div>
                </div>

                {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ STEP 1: PHOTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Camera className="w-5 h-5 text-primary" />
                                Upload Your Profile Photo
                            </DialogTitle>
                            <DialogDescription>
                                Help your CHW recognise you. You can skip this for now and add a photo later.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-4 py-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-32 h-32 rounded-full border-4 border-dashed border-primary/40 flex items-center justify-center overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors group"
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                                        <User className="w-10 h-10" />
                                        <span className="text-xs">Tap to select</span>
                                    </div>
                                )}
                                {photoUploaded && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {selectedFile && !photoUploaded && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">{selectedFile.name}</p>
                            )}

                            <div className="flex gap-3 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {previewUrl ? 'Change Photo' : 'Choose Photo'}
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1"
                                    onClick={handleUploadPhoto}
                                    disabled={!selectedFile || uploadingPhoto || photoUploaded}
                                >
                                    {uploadingPhoto ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploadingâ€¦</>
                                    ) : photoUploaded ? (
                                        <><CheckCircle2 className="w-4 h-4 mr-2" />Uploaded</>
                                    ) : 'Upload'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={handleNextToStep2}>
                                Skip for Now
                            </Button>
                            <Button type="button" className="flex-1" onClick={handleNextToStep2} disabled={!photoUploaded}>
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </>
                )}

                {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ STEP 2: NEXT OF KIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                {step === 2 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Heart className="w-5 h-5 text-rose-500" />
                                Next of Kin Details
                            </DialogTitle>
                            <DialogDescription>
                                Who should we contact in an emergency? This information is{' '}
                                <strong>required</strong> to complete your profile.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="nok-name">Full Name *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="nok-name"
                                        name="name"
                                        type="text"
                                        placeholder="e.g. John Otieno"
                                        className="pl-10"
                                        value={nokData.name}
                                        onChange={handleNokChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="nok-phone">Phone Number *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="nok-phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="07xxxxxxxx"
                                        className="pl-10"
                                        value={nokData.phone}
                                        onChange={handleNokChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="nok-sex">Sex *</Label>
                                <Select value={nokData.sex} onValueChange={(v) => setNokData({ ...nokData, sex: v })}>
                                    <SelectTrigger id="nok-sex"><SelectValue placeholder="Select sex" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="nok-relationship">Relationship *</Label>
                                <Select value={nokData.relationship} onValueChange={(v) => setNokData({ ...nokData, relationship: v })}>
                                    <SelectTrigger id="nok-relationship"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                                    <SelectContent>
                                        {RELATIONSHIPS.map((r) => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                                â† Back
                            </Button>
                            <Button className="flex-1" onClick={handleFinish} disabled={savingNok}>
                                {savingNok ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Savingâ€¦</>
                                ) : (
                                    <>Complete Profile <CheckCircle2 className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
