-- Update the handle_new_user function to support Google OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, avatar)
  VALUES (
    NEW.id,
    -- Try to get 'nome' first (for email/password signup), then 'full_name' (for Google OAuth), fallback to email
    COALESCE(
      NEW.raw_user_meta_data->>'nome',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    -- Try to get 'avatar' first, then 'avatar_url' (for Google OAuth)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar',
      NEW.raw_user_meta_data->>'avatar_url'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

