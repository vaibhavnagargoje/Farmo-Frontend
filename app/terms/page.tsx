import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"

export const metadata = {
  title: "Terms & Conditions | Farmo",
  description: "Read the rules and guidelines for using the Farmo agricultural platform.",
}

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 md:py-16">
        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground mb-4">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="space-y-8 text-foreground/90 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing or using the Farmo mobile application or website ("Platform"), you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you must not access the service. These Terms apply to all users, including customers seeking services ("Users") and those providing them ("Partners/Providers").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Platform Description</h2>
              <p className="mb-2">
                Farmo is a digital marketplace that connects agricultural workers, machinery owners, and transporters (Service Providers) with individuals seeking such services. We provide the technology to facilitate these connections, but <strong>Farmo is not directly responsible for the fulfillment, quality, or safety of the services rendered.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are responsible for safeguarding your authentication OTPs and maintaining the confidentiality of your account.</li>
                <li>You agree to provide accurate, current, and complete information during registration and keep it updated.</li>
                <li>Accounts are non-transferable. You must immediately notify Farmo of any unauthorized use of your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Bookings and Payments</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Requests:</strong> The Platform enables you to schedule services in advance or request them instantly. All bookings are subject to Provider availability.</li>
                <li><strong>Cancellations:</strong> Users may cancel scheduled bookings within the grace period (typically 24 hours prior) without penalty. Instant bookings that are cancelled after being accepted by a provider may incur a cancellation fee.</li>
                <li><strong>Payments:</strong> All fees are stated at the time of booking. Payment must be completed via the authorized channels listed on the platform. Farmo acts as a limited payment collection agent for Service Providers.</li>
              </ul>
            </section>

            <section className="bg-muted/30 p-5 rounded-2xl border border-border">
              <h2 className="text-xl font-bold text-foreground mb-3">5. Service Provider Guidelines</h2>
              <p className="mb-3">
                If you are registered as a "Partner" or Service Provider, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Maintain necessary licenses, insurance, and qualifications required to operate farm machinery legally.</li>
                <li>Accurately represent the condition of your equipment and the quality of your labor.</li>
                <li>Commit to accepted bookings and use the provided security OTPs to start and complete jobs legitimately.</li>
                <li>Farmo retains the right to remove Providers from the platform for repeated cancellations, poor ratings, or fraudulent behavior.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Limitation of Liability</h2>
              <p className="mb-2">
                To the maximum extent permitted by applicable law, Farmo and its affiliates shall not be liable for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any direct, indirect, incidental, or consequential damages resulting from your use of the Platform.</li>
                <li>Property damage, crop failure, or personal injury occurring during the fulfillment of a booked service.</li>
                <li>Disputes or disagreements solely between Users and Service Providers. We encourage both parties to resolve disputes amicably, though Farmo may assist in mediation at its sole discretion.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Modifications to the Service</h2>
              <p>
                We reserve the right to withdraw or amend our service, and any material we provide, at our sole discretion without notice. We will not be liable if, for any reason, all or any part of the Platform is unavailable at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">8. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

          </div>
        </div>
      </main>

      <BottomNav variant="farmer" />
    </div>
  )
}
