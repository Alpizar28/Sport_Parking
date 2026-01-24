# Sport Parking - Reservation System (MVP)

A Next.js 14 Web Application for managing reservation of soccer fields and event spaces. Features a modern Glassmorphism UI, real-time availability checks, and secure payment integration flows.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: TailwindCSS 4, Custom CSS (Glassmorphism)
- **Auth**: Supabase Auth (SSR)
- **Payments**: Yappy Integration (Structure ready)

## Comparison with other solutions
This project prioritizes UX with a clean, step-by-step reservation flow and strict backend validation for hourly blocks.

## Setup Instructions

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/sport-parking.git
    cd sport-parking
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Copy the example file and fill in your Supabase details.
    ```bash
    cp .env.example .env.local
    ```
    Populate `.env.local` with your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.

4.  **Database Setup**:
    Run the SQL scripts provided in `supabase_schema.sql` (if available) in your Supabase SQL Editor to create the necessary tables (`reservations`, `resources`, etc.) and Security Policies (RLS).

5.  **Run Locally**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Security Note

This repository does **NOT** contain real production keys or payment secrets.
- Payment flows use mock URLs or placeholder logic.
- Admin capabilities require a Service Role key which must be kept secret in your local environment.

## License
MIT
