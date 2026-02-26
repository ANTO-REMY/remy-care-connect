/**
 * PhotoOnboardingModal â€” optional photo upload shown on first login for CHW and Nurse.
 *
 * Photo is optional â€” â€œSkip for Nowâ€ completes onboarding without uploading.
 * Location is captured at registration, NOT here.
 *
 * The modal has no backdrop-close or Escape-key close.
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { uploadPhoto } from '@/services/photoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Camera, Upload, CheckCircle2, Loader2 } from 'lucide-react';

interface PhotoOnboardingModalProps {
    open: boolean;
    onComplete: () => void;
    /** Label used in the subtitle, e.g. "CHW" or "Nurse" */
    roleName?: string;
}

export default function PhotoOnboardingModal({
    open,
    onComplete,
    roleName = 'Health Worker',
}: PhotoOnboardingModalProps) {
    const { user, markOnboardingComplete } = useAuth();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);

    const initials = user
        ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
        : '?';

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            toast.error('Invalid file type', { description: 'Please upload a JPG, PNG, or WebP image.' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large', { description: 'Maximum allowed size is 5 MB.' });
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setUploaded(false);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            await uploadPhoto(selectedFile);
            setUploaded(true);
            toast.success('Photo uploaded! ðŸŽ‰', { description: 'Your profile photo has been saved.' });
        } catch (err: any) {
            toast.error('Upload failed', { description: err.message || 'Could not upload photo. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    const handleComplete = () => {
        markOnboardingComplete();
        onComplete();
    };

    return (
        <Dialog open={open} onOpenChange={() => { /* intentionally blocked */ }}>
            <DialogContent
                className="sm:max-w-md"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                        Welcome, {user?.first_name ?? roleName}! ðŸ‘‹
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Add a profile photo so mothers and colleagues can recognise you.
                        This is optional â€” you can add it later.
                    </DialogDescription>
                </DialogHeader>

                {/* Photo preview */}
                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-primary/20">
                            <AvatarImage src={previewUrl ?? undefined} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        {uploaded && (
                            <CheckCircle2 className="absolute -bottom-1 -right-1 h-7 w-7 text-green-500 fill-white" />
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {!selectedFile ? (
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                            <Camera className="h-4 w-4" />
                            Choose Photo
                        </Button>
                    ) : uploaded ? (
                        <p className="text-sm text-green-600 font-medium">Photo saved âœ“</p>
                    ) : (
                        <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploading ? 'Uploadingâ€¦' : 'Upload Photo'}
                        </Button>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-2">
                    {uploaded ? (
                        <Button onClick={handleComplete} className="w-full">
                            Continue to Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button onClick={handleComplete} variant="outline" className="w-full">
                                Skip for Now
                            </Button>
                            {selectedFile && !uploaded && (
                                <p className="text-xs text-center text-muted-foreground">
                                    You can upload your photo later from the Profile page.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
