"use client"

import { AccountLayout } from "@/components/account-layout"
import { ProfileContent } from "@/components/profile-content"
import { useLanguage } from "@/contexts/language-context"

export default function ProfilePage() {
  const { t } = useLanguage()
  
  return (
    <AccountLayout pageTitle={t("profile.title")}>
      <ProfileContent />
    </AccountLayout>
  )
}
