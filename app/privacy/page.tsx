import { DesktopHeader } from "@/components/desktop-header"
import { MobileHeader } from "@/components/mobile-header"
import { BottomNav } from "@/components/bottom-nav"

export const metadata = {
  title: "Privacy Policy | Farmo",
  description: "Learn how Farmo collects, uses, and protects your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen pb-24 lg:pb-0 bg-background">
      <DesktopHeader variant="farmer" />
      <MobileHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 md:py-16">
        <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm">
          <h1 className="text-3xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <div className="space-y-8 text-foreground/90 leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Introduction</h2>
              <p>
                Welcome to Farmo! We are committed to protecting your privacy and ensuring your personal information is handled in a safe and responsible manner. This policy describes how we collect, use, and share your data when you use the Farmo platform via our website and mobile applications. By using Farmo, you consent to the data practices described in this statement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Information We Collect</h2>
              <p className="mb-2">We collect the following personal information to provide our services effectively:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contact Information:</strong> Your phone number and email address to authenticate your identity.</li>
                <li><strong>Profile Details:</strong> Your full name and optional profile picture.</li>
                <li><strong>Camera and Device Storage:</strong> We request access to your device's camera and media gallery solely so you can capture or upload profile photos and accurately showcase images of your machinery or services.</li>
                <li><strong>Location Data:</strong> With your permission, we collect precise device location (latitude/longitude) to connect you with nearby agricultural service providers, machinery rentals, and to provide accurate navigation and directions.</li>
                <li><strong>Device Information:</strong> We collect push notification tokens to send you essential booking updates.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
              <p className="mb-2">Your information is strictly used to facilitate the core functions of the Farmo platform:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Creating and managing your user account securely.</li>
                <li>Browsing local farm equipment and booking laborers.</li>
                <li>Sending you booking confirmations, updates, and OTP verification codes.</li>
                <li>Enhancing local search relevance using your submitted location data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Information Sharing and Disclosure</h2>
              <p>
                As an intermediary marketplace, we only share necessary Booking information with Service Providers or Partners after you explicitly request or confirm a booking. This includes your name, contact information, and job location so they can fulfill the service. We do not sell your personal data to third-party marketers.
              </p>
            </section>

            <section className="bg-muted/30 p-5 rounded-2xl border border-border">
              <h2 className="text-xl font-bold text-foreground mb-3">5. Data Retention and Deletion Policy</h2>
              <p className="mb-3">
                You have the right to request the complete deletion of your personal data at any time. We have made this process transparent and accessible directly within the app.
              </p>
              <h3 className="font-semibold mb-2">How to delete your account:</h3>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>Log into the Farmo app or website.</li>
                <li>Navigate to your <strong>Settings</strong> page from your profile dashboard.</li>
                <li>Scroll down to <strong>Account Preferences</strong> and select <strong>Delete Account</strong>.</li>
                <li>Confirm the deletion. This will permanently soft-terminate your account—removing public access, clearing your local session data, and ensuring your profile is no longer discoverable.</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                Alternatively, you can request manual data deletion by emailing us directly at <a href="mailto:support@farmo.in" className="text-primary hover:underline">support@farmo.in</a>. We will process your deletion request within 14 days. Certain transactional data may be retained securely for legal, auditing, and tax compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Security Guidelines</h2>
              <p>
                We use industry-standard encryption, token-based authentication (JWT), and securely configured cloud servers to protect your sensitive inputs against unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Contact Us</h2>
              <p>
                If you have questions about this privacy policy or your personal data, please reach out to us:
              </p>
              <p className="mt-2 font-medium">Email: <a href="mailto:privacy@farmo.in" className="text-primary hover:underline">privacy@farmo.in</a></p>
              <p className="mt-1 font-medium">Phone: +91 91758 77571</p>
            </section>

          </div>
        </div>
      </main>

      <BottomNav variant="farmer" />
    </div>
  )
}
