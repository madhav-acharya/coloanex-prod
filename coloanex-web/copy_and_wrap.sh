#!/bin/bash

cd /Users/madhav/coding/coloanex/coloanex-web/src/pages

# Pricing
cp public/Pricing.tsx borrower/BorrowerPricing.tsx
sed -i '' 's/import PublicLayout from "@\/components\/layouts\/PublicLayout";/import BorrowerLayout from "@\/components\/layouts\/BorrowerLayout";/g' borrower/BorrowerPricing.tsx
sed -i '' 's/<PublicLayout>/<BorrowerLayout className="bg-transparent" hideSidebar>/g' borrower/BorrowerPricing.tsx
sed -i '' 's/<\/PublicLayout>/<\/BorrowerLayout>/g' borrower/BorrowerPricing.tsx
sed -i '' 's/export default function Pricing/export default function BorrowerPricing/g' borrower/BorrowerPricing.tsx

# Profile
cp admin/Profile.tsx borrower/BorrowerProfile.tsx
sed -i '' 's/import DashboardLayout from "@\/components\/layouts\/DashboardLayout";/import BorrowerLayout from "@\/components\/layouts\/BorrowerLayout";/g' borrower/BorrowerProfile.tsx
sed -i '' 's/<DashboardLayout/<BorrowerLayout/g' borrower/BorrowerProfile.tsx
sed -i '' 's/<\/DashboardLayout>/<\/BorrowerLayout>/g' borrower/BorrowerProfile.tsx
sed -i '' 's/const Profile =/const BorrowerProfile =/g' borrower/BorrowerProfile.tsx
sed -i '' 's/export default Profile;/export default BorrowerProfile;/g' borrower/BorrowerProfile.tsx

# Settings
cp admin/Settings.tsx borrower/BorrowerSettings.tsx
sed -i '' 's/import DashboardLayout from "@\/components\/layouts\/DashboardLayout";/import BorrowerLayout from "@\/components\/layouts\/BorrowerLayout";/g' borrower/BorrowerSettings.tsx
sed -i '' 's/<DashboardLayout/<BorrowerLayout/g' borrower/BorrowerSettings.tsx
sed -i '' 's/<\/DashboardLayout>/<\/BorrowerLayout>/g' borrower/BorrowerSettings.tsx
sed -i '' 's/const Settings =/const BorrowerSettings =/g' borrower/BorrowerSettings.tsx
sed -i '' 's/export default Settings;/export default BorrowerSettings;/g' borrower/BorrowerSettings.tsx

rm copy_and_wrap.sh
