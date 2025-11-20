# Setting up FastAPI with Supabase PostgreSQL

This guide will help you integrate your FastAPI backend with Supabase PostgreSQL database.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Python Dependencies**: Install required packages

## Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 2: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ikigotchi-garden`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

## Step 3: Get Database Connection String

1. In your Supabase project dashboard:
   - Go to **Settings** → **Database**
   - Scroll down to **Connection string**
   - Copy the **URI** format connection string
   - It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file with your Supabase details:
   ```
   DATABASE_URL=postgresql://postgres:your_actual_password@db.your_project_ref.supabase.co:5432/postgres
   APP_HOST=0.0.0.0
   APP_PORT=8000
   ```

## Step 5: Initialize Database

Run the database initialization script to create tables and seed data:

```bash
python init_db.py
```

This will:
- Create the `plant_data` and `user_plants` tables
- Insert sample plant data

## Step 6: Test the Connection

Start the FastAPI server:

```bash
python main.py
```

Visit `http://localhost:8000/docs` to see the API documentation.

## Step 7: Verify in Supabase Dashboard

1. Go to your Supabase project
2. Click on **Table Editor**
3. You should see:
   - `plant_data` table with 7 sample plants
   - `user_plants` table (empty initially)

## Architecture Overview

```
React Native App
       ↓
   FastAPI Backend (Render/Railway)
       ↓
   Supabase PostgreSQL
```

## Database Schema

### plant_data table
- `id` (Primary Key)
- `name`, `scientific_name`
- `description`, `care_instructions`
- `watering_frequency_days`
- `sunlight_requirement`, `difficulty_level`
- `image_url`
- `created_at`, `updated_at`

### user_plants table
- `id` (Primary Key)
- `user_id` (device/user identifier)
- `plant_data_id` (Foreign Key to plant_data)
- `nickname`, `date_planted`
- `last_watered`, `last_fertilized`
- `notes`, `location`
- `is_active`, `custom_watering_frequency`
- `created_at`, `updated_at`

## Next Steps

After setting up the database:
1. Deploy FastAPI backend to Render/Railway
2. Update your React Native app to use the deployed API URL
3. Test the full integration

## Troubleshooting

**Connection Issues:**
- Verify your DATABASE_URL is correct
- Check that your Supabase project is running
- Ensure your IP is allowed (Supabase allows all IPs by default)

**Import Errors:**
- Make sure you've installed all dependencies: `pip install -r requirements.txt`

**Table Creation Fails:**
- Check your database permissions
- Verify the connection string format