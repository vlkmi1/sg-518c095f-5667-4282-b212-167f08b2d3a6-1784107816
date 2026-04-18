-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catches table (úlovky)
CREATE TABLE IF NOT EXISTS catches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  species TEXT NOT NULL,
  length_cm DECIMAL(10,2),
  weight_kg DECIMAL(10,2),
  country TEXT NOT NULL,
  region TEXT,
  district TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  caught_at TIMESTAMP WITH TIME ZONE NOT NULL,
  bait_brand TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catches ENABLE ROW LEVEL SECURITY;

-- Profiles policies (T1 - private user data)
CREATE POLICY "select_own_profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Catches policies (T2 - public read, authenticated write)
CREATE POLICY "public_read_catches" ON catches FOR SELECT USING (true);
CREATE POLICY "auth_insert_catches" ON catches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_own_catches" ON catches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "auth_delete_own_catches" ON catches FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS catches_user_id_idx ON catches(user_id);
CREATE INDEX IF NOT EXISTS catches_country_idx ON catches(country);
CREATE INDEX IF NOT EXISTS catches_region_idx ON catches(region);
CREATE INDEX IF NOT EXISTS catches_district_idx ON catches(district);
CREATE INDEX IF NOT EXISTS catches_species_idx ON catches(species);
CREATE INDEX IF NOT EXISTS catches_caught_at_idx ON catches(caught_at DESC);