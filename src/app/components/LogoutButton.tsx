import { signOut } from "@/auth";

export default function LogoutButton() {
    return (
        <form
            action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
            }}
        >
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                Log Out
            </button>
        </form>
    );
}
