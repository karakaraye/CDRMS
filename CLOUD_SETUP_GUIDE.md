# CDRMS Cloud — Complete Migration & Deployment Guide

This guide explains how to use and host your new **CDRMS Cloud Web Application**, connecting it to a live cloud database so records are accessible from anywhere in the world.

---

## 🚀 1. What Has Been Built

We transformed the local desktop application into a **full-featured, responsive Cloud Web Application** located in the [`cdrms-web/`](file:///c:/Users/BNXHYLVA/Desktop/CDRMS/cdrms-web) folder:

- **Universal Accessibility**: Access from any web browser (Chrome, Edge, Safari, Opera), tablet, or smartphone.
- **Records Directory & Filtering**: Left navigation tree with program filters (*Full-Time*, *Part-Time*) and student batches (*U2021*, *U2022*, *U2023*, etc.).
- **Live Student Management**: Full student registry, search by matric no or name, add/edit biodata, guardian and sponsor contact details.
- **Course Catalogue Manager**: Complete curriculum matching the University of Port Harcourt Department of Management (100–400 levels, both Full-Time and Part-Time tracks).
- **Interactive Results Worksheet**: Direct score entry with automated Nigerian 5-point grading conversion (A, B, C, D, E, F), repeat grade point capping (capping A/B/C at 3.0 GP), course waivers, and real-time semester GPA calculation.
- **Academic Transcript & Student Spreadsheet**: Printable, official transcript generator matching Uniport format with headers, biodata, course tables, TCU/TQP/CGPA calculations, and the 123 Credit Units benchmark rule.
- **Cloud Database Ready**: Built-in direct integration with **Supabase (Hosted Cloud PostgreSQL)**, plus local storage fallback for offline support.

---

## ☁️ 2. Connecting to Supabase Cloud Database (Free & Permanent)

To store all your students, courses, and results permanently in the cloud:

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create an account.
2. Click **New Project**, name it (e.g. `cdrms-uniport`), set a database password, and click **Create new project**.

### Step 2: Run the Database Schema
1. In your Supabase project dashboard, click **SQL Editor** in the left menu.
2. Click **New Query**.
3. Open the file [`supabase_setup.sql`](file:///c:/Users/BNXHYLVA/Desktop/CDRMS/supabase_setup.sql) located in your CDRMS folder, copy all contents, paste into the Supabase SQL Editor, and click **Run**.
4. This creates the `students`, `courses`, and `results` tables with all indexes and permissions.

### Step 3: Link the Web App
1. In Supabase, go to **Project Settings** > **API**.
2. Copy your **Project URL** (e.g. `https://xyzcompany.supabase.co`).
3. Copy your **anon / public key** (`eyJhbGciOiJIUzI1NiIsIn...`).
4. In the CDRMS web application, click the **Cloud Status Badge** in the top navbar (it currently says `Local / Offline`).
5. Paste your URL and Anon Key into the modal, then click **Test Connection** followed by **Save & Connect Cloud**.
6. Switch to the **Data Synchronization** tab and click **Push Local Data to Cloud** to immediately migrate your existing students and course catalogue to the cloud!

---

## 🌐 3. Free 1-Click Online Cloud Deployment (Accessible 24/7 Everywhere)

To make CDRMS accessible to lecturers and staff across the internet with a dedicated web link (e.g. `https://cdrms-uniport.vercel.app`):

### Option A: Vercel (Recommended — Free)
1. Sign up at [https://vercel.com](https://vercel.com).
2. Install Vercel CLI or connect your GitHub repository:
   ```bash
   cd cdrms-web
   npx vercel
   ```
3. Set your environment variables in Vercel settings:
   - `VITE_SUPABASE_URL` = *Your Supabase URL*
   - `VITE_SUPABASE_ANON_KEY` = *Your Supabase Anon Key*
4. Your system will be live at a public HTTPS address in seconds!

### Option B: Netlify (Free)
1. Drag and drop the `cdrms-web/dist` folder onto [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Your website is instantly online!

---

## 💻 4. Running Locally & On Local Wi-Fi Network

- **1-Click Local Launch**: Double-click [`run_web.bat`](file:///c:/Users/BNXHYLVA/Desktop/CDRMS/run_web.bat).
- **Local Browser**: [http://localhost:5173/](http://localhost:5173/)
- **Access from Phone/Other PC on Same Wi-Fi**: Open `http://192.168.1.8:5173/` in your mobile browser.
