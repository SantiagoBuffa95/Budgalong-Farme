
import Image from "next/image";
import Link from "next/link";

export default function AssistantsPage() {
    return (
        <main className="container">
            <header className="header" style={{ position: 'relative', marginTop: '4rem' }}>
                <div style={{ position: 'absolute', top: '1rem', left: '0' }}>
                    <Link href="/" className="btn btn-secondary">
                        ← Back to Home
                    </Link>
                </div>
                <h1>Budgalong Assistants</h1>
                <p>AI-Powered Helpers for Farm Management</p>
            </header>

            <div className="grid-auto" style={{ justifyContent: 'center' }}>
                {/* Loader Card */}
                <a
                    href="https://chatgpt.com/g/g-698ae54896188191b75bb1681f70ea73-loader-sdlg-lg936l"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card"
                    style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '150px',
                        height: '150px',
                        border: '4px solid #000',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#eee' // Fallback
                    }}>
                        <Image
                            src="/assistants/loader.png"
                            alt="Loader GPT"
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <h2 style={{ marginBottom: '0.5rem' }}>LOADER</h2>
                        <span className="btn btn-assistants" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Open in ChatGPT ↗
                        </span>
                    </div>
                </a>

                {/* Header Card */}
                <a
                    href="https://chatgpt.com/g/g-698af1fec1088191860986575c83d16e-9750-sts-combine-header"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card"
                    style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '150px',
                        height: '150px',
                        border: '4px solid #000',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#eee' // Fallback
                    }}>
                        <Image
                            src="/assistants/header.png"
                            alt="Header GPT"
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <h2 style={{ marginBottom: '0.5rem' }}>HEADER</h2>
                        <span className="btn btn-assistants" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                            Open in ChatGPT ↗
                        </span>
                    </div>
                </a>
            </div>

            <footer style={{
                marginTop: '4rem',
                textAlign: 'center',
                color: '#888',
                fontSize: '0.9rem'
            }}>
                <p>These assistants require a ChatGPT Plus subscription.</p>
            </footer>
        </main>
    );
}
