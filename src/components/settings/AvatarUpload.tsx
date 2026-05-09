import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  url?: string | null;
  onUpload: (url: string) => void;
  size?: number;
}

export const AvatarUpload = ({ url, onUpload, size = 80 }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        className="relative group cursor-pointer"
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-[var(--bg-elevated)] border-2 border-[var(--border)] group-hover:border-[var(--accent)] transition-all flex items-center justify-center">
          {url ? (
            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={size * 0.4} className="text-[var(--text-muted)]" />
          )}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="text-white animate-spin" size={20} />
          ) : (
            <Camera className="text-white" size={20} />
          )}
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        disabled={uploading}
        className="hidden"
      />
      
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
        {uploading ? 'Uploading...' : 'Click to change photo'}
      </p>
    </div>
  );
};
