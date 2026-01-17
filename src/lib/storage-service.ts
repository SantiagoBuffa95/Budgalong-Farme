
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Optional, fallback to anon

// Use Service Role if available (bypasses RLS), otherwise Anon (needs RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

export async function uploadPayslip(
    fileName: string,
    fileBuffer: ArrayBuffer
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .storage
            .from('payslips')
            .upload(fileName, fileBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (error) {
            console.error("Storage upload error:", error);
            // If bucket doesn't exist? SDK doesn't auto-create.
            return null;
        }

        // Generate Public URL (if public) OR Signed URL (if private)
        // For Payroll, we want signed URLs usually, but for MPV assuming Public or just path storage.
        // Let's store the full path or public URL.

        // If bucket is private:
        // const { data: signedData } = await supabase.storage.from('payslips').createSignedUrl(fileName, 31536000); // 1 year?
        // return signedData?.signedUrl || null;

        // If bucket is public:
        const { data: publicData } = supabase.storage.from('payslips').getPublicUrl(fileName);
        return publicData.publicUrl;

    } catch (e) {
        console.error("Upload exception:", e);
        return null;
    }
}
