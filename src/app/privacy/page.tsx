
export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background text-muted-foreground p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may include your name, email address, and game identifiers.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
                    <p>We use your information to provide, maintain, and improve our services, process transactions, and communicate with you about updates and promotions.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">3. Data Security</h2>
                    <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">4. Cookies</h2>
                    <p>We use cookies to understand how you use our site and to improve your experience. You can control cookies through your browser settings.</p>
                </section>

                <p className="text-sm text-muted-foreground mt-12">Last updated: January 2026</p>
            </div>
        </div>
    );
}
