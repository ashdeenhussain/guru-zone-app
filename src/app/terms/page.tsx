
export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-muted-foreground p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
                    <p>Welcome to Guru Zone. By accessing our website and using our services, you agree to be bound by the following terms and conditions.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">2. User Eligibility</h2>
                    <p>You must be at least 18 years old to use this platform. By registering, you confirm that you meet this age requirement.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">3. Fair Play Policy</h2>
                    <p>We have a zero-tolerance policy for cheating, hacking, or using unauthorized third-party tools. Any user found violating these rules will be permanently banned and their funds forfeited.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-foreground">4. Payments & Withdrawals</h2>
                    <p>All deposits and withdrawals are processed securely. We reserve the right to verify user identity before processing withdrawals to prevent fraud.</p>
                </section>

                <p className="text-sm text-muted-foreground mt-12">Last updated: January 2026</p>
            </div>
        </div>
    );
}
