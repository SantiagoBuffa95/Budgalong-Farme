import { redirect } from "next/navigation";

export default function LoginPage() {
    // Redirect to employee login (no role chooser needed)
    redirect("/login/employee");
}
