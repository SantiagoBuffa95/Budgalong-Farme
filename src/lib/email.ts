
/**
 * Email Service Abstraction
 * 
 * In a production environment, this would integrate with a provider like SendGrid, AWS SES, or Resend.
 * For now, in development, it simply logs the email content to the server console.
 */

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
    // 1. Check if we have a real provider configured (e.g. API keys)
    // const apiKey = process.env.EMAIL_API_KEY; 
    // if (apiKey) { ... call provider ... }

    // 2. Fallback / Dev Mode: Log to Console
    console.log("📨 [EMAIL SERVICE] ------------------------------------------------");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text Body:`);
    console.log(text);
    if (html) {
        console.log(`[HTML Body included but hidden in log]`);
    }
    console.log("-------------------------------------------------------------------");

    return true; // Simulate success
}
