# ClubOS Setup Guide

This document provides step-by-step instructions to set up ClubOS from scratch.

---

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **Supabase Account** (free at supabase.com)
- **Vercel Account** (for deployment, free at vercel.com)

---

## 🚀 Step 1: Clone the Repository

```bash
git clone https://github.com/Solez-ai/ClubOS.git
cd ClubOS/site
```

---

## 📦 Step 2: Install Dependencies

```bash
cd site
npm install
```

---

## 🔑 Step 3: Set Up Supabase

### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose a name (e.g., "clubos")
4. Set a strong database password
5. Choose a region close to your users
6. Click **"Create Project"** - wait for setup to complete

### 3.2 Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `site/SQL/01_schema.sql`
3. Paste and run it in the SQL Editor
4. Copy the contents of `site/SQL/03_seed.sql` (optional - for demo data)
5. Paste and run it in the SQL Editor

### 3.3 Get Your API Keys

1. In Supabase dashboard, go to **Project Settings > API**
2. Copy these values:
   - **Project URL** (looks like `https://xyz.supabase.co`)
   - **anon public key** (starts with `sb_`)
   - **service_role key** (starts with `ey...`, keep this secret!)

---

## 🔐 Step 4: Configure Environment Variables

Create a `.env.local` file in the `site/` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=ey-your_service_role_key_here

# Site URL (change for production)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: HMAC secret for QR codes (generate a random string)
CHECKIN_HMAC_SECRET=clubos_random_secret_key_2026
```

> ⚠️ **Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

---

## 🏃 Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Step 6: Create Your First Accounts

### Create an Organizer Account

1. Go to `/signup`
2. Select **"Organizer"** role
3. Fill in your details
4. Create your organization when prompted

### Create a Participant Account (for testing)

1. Go to `/signup`
2. Select **"Participant"** role
3. Fill in your details

---

## 🎪 Step 7: Create Your First Fest & Event

### As an Organizer:

1. Go to `/manage/organization/create` (if you haven't created one yet)
2. Go to `/manage/fest/create?orgId=YOUR_ORG_ID`
3. Fill in fest details:
   - Title, tagline, description
   - Cover image URL (use any image URL)
   - Start/end dates and times
   - Venue name and Google Maps link
4. Click "Create Fest"

5. Go to `/manage/event/create?festId=YOUR_FEST_ID`
6. Fill in event details:
   - Title, category, description
   - Rules, prizes
   - Schedule (start, registration opens/deadline)
   - Venue and Google Maps link
   - Capacity, team settings, XP rewards
   - **Segments** (add multiple with pricing)
7. Click "Create Event"

---

## 💳 Step 8: Payment Setup (BKash & Nagad)

### For Each Paid Segment:

When creating segments in the event creation flow:

1. **Choose Payment Method:**
   - **BKash Send Money**: Participants send money to a specific number
   - **BKash Pay Bill**: Participants pay a bill number
   - **Nagad Send Money**: Participants send money to a specific number  
   - **Nagad Pay Bill**: Participants pay a bill number

2. **For Send Money:**
   - Provide the mobile number to send money to
   - Example: `{"number": "01700000000", "type": "send_money", "display": "Send money to 01700000000 (BKash)"}`

3. **For Pay Bill:**
   - Provide the bill number pattern
   - Example: `{"bill_no": "AI2026-###", "type": "pay_bill", "display": "Pay bill AI2026-### to BKash"}`

### BKash/Nagad Button Colors:

- **BKash**: Pink theme (`#F74C3C` / `#E91E63`)
- **Nagad**: Orange/Yellow theme (`#F59E0B` / `#FF9800`)

---

## 📧 Step 9: Email Notifications

The app includes automated email notifications:

- **Registration Confirmation**: Sent when a participant registers
- **Payment Declined**: Sent when an organizer declines a registration
- **Payment Verified**: Sent when an organizer verifies a payment

### To Enable Real Email Sending:

1. Set up a Supabase Edge Function for email (use Resend, SendGrid, or similar)
2. Or configure a third-party email service

For now, emails are logged to console in development.

---

## 🌐 Step 10: Deploy to Vercel

### 10.1 Push to GitHub

```bash
git add .
git commit -m "Initial ClubOS setup"
git push origin main
```

### 10.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Add Environment Variables (from Step 4):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
   - `NEXT_PUBLIC_SITE_URL` (your Vercel URL)
   - `CHECKIN_HMAC_SECRET`
6. Click **"Deploy"**

---

## 📱 Features Implemented

### Participant Features:
- ✅ Role-based signup (Participant/Organizer)
- ✅ Browse events with search & filters
- ✅ Filter by category, tags, dates, status
- ✅ Event detail pages with full information
- ✅ Registration with segment selection
- ✅ Payment flow (BKash/Nagad with proper UI)
- ✅ Transaction ID upload with screenshot
- ✅ Registration history/manage page
- ✅ Account settings with profile editing
- ✅ Passport/ticket view

### Organizer Features:
- ✅ Role-based signup (Organizer)
- ✅ Create organization
- ✅ Create fest with cover image, dates, venue, Google Maps
- ✅ Create event with full details
- ✅ Add multiple segments with pricing
- ✅ Choose payment method per segment (BKash/Nagad, Send Money/Pay Bill)
- ✅ View participants list
- ✅ Verify or decline registrations
- ✅ Add decline reason/comment
- ✅ Participant table with all info
- ✅ Export CSV (ready to implement)

### Technical Features:
- ✅ Complete SQL schema with all tables
- ✅ Row Level Security (RLS) policies
- ✅ Category tags system
- ✅ Segments with payment info
- ✅ Email notification system
- ✅ Supabase integration
- ✅ TypeScript types for all entities

---

## 🔧 Troubleshooting

### Build Errors
If the build fails with Supabase errors:
- Ensure `.env.local` has all required variables
- Run `npm run build` in the `site/` directory

### Database Errors
If you see "table does not exist":
- Make sure you ran `01_schema.sql` in Supabase SQL Editor
- Check that your environment variables point to the correct project

### Auth Errors
If signup/login doesn't work:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase dashboard for any errors

---

## 📞 Support

For issues or questions:
1. Check this setup guide
2. Review the SQL schema in `site/SQL/01_schema.sql`
3. Check Supabase dashboard for errors
4. Open an issue on GitHub

---

## 📄 License

MIT License - see LICENSE file for details.
