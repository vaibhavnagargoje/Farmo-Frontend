"use client"

import { PartnerLayout } from "@/components/partner-layout"
import { ProfileContent } from "@/components/profile-content"

export default function PartnerProfilePage() {
    return (
        <PartnerLayout pageTitle="My Profile">
            <ProfileContent isPartnerView={true} />
        </PartnerLayout>
    )
}
