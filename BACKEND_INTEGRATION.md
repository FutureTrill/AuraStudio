
# Aura Studio Backend Integration Guide

To enable persistent users, prompt history, and project saving, follow these steps in your Supabase dashboard.

## 1. Authentication Setup
- Go to **Authentication > Providers**.
- Enable **Email/Password**.
- Disable "Confirm Email" in **Authentication > Settings** for instant access during development.

## 2. Table Definitions (Explicit)

### Table: `profiles`
Tracks user-specific global states like usage count.
- `id` (uuid, primary key): References `auth.users.id`
- `usage_count` (int): Number of sites generated.
- `updated_at` (timestamp): Last profile update.

### Table: `projects`
Stores the generated assets and conversation context.
- `id` (uuid, primary key): Unique ID for the project.
- `user_id` (uuid): References `profiles.id`.
- `name` (text): Display name for the build (e.g., "Aura_Build_2024-02-14").
- `code` (text): The HTML/CSS/JS output.
- `chat_history` (jsonb): Array of `Message` objects for conversation context.
- `created_at` (timestamp): Creation date.

## 3. Database SQL (Run in SQL Editor)

```sql
-- 1. Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  usage_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  chat_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Security Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Profile auto-creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```
