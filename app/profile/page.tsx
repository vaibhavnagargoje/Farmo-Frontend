"use client"

import { AccountLayout } from "@/components/account-layout"
import { ProfileContent } from "@/components/profile-content"

export default function ProfilePage() {
  return (
    <AccountLayout pageTitle="My Profile">
      <ProfileContent />
    </AccountLayout>
  )
}
