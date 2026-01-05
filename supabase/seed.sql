-- Seed data for testing Nossa Casa app
-- WARNING: This file is for development/testing only
-- Run this AFTER creating your first user via authentication

-- Note: Replace these UUIDs with actual user IDs from your auth.users table
-- You can get user IDs by running: SELECT id, email FROM auth.users;

-- Example task templates (adjust after getting user IDs)
INSERT INTO tasks_master (nome, descricao, xp_value, recurrence_type, days_of_week) VALUES
  ('Lavar Louça', 'Lavar toda a louça do dia', 20, 'daily', ARRAY[0,1,2,3,4,5,6]),
  ('Limpar Banheiro', 'Limpeza completa do banheiro', 50, 'weekly', ARRAY[0]),
  ('Varrer a Casa', 'Varrer todos os cômodos', 30, 'daily', ARRAY[0,1,2,3,4,5,6]),
  ('Passar Roupa', 'Passar as roupas acumuladas', 40, 'weekly', ARRAY[6]),
  ('Cozinhar Jantar', 'Preparar o jantar', 35, 'daily', ARRAY[0,1,2,3,4,5,6]),
  ('Levar Lixo para Fora', 'Levar o lixo até a coleta', 15, 'daily', ARRAY[0,2,4,6]),
  ('Organizar Quarto', 'Arrumar e organizar o quarto', 25, 'daily', ARRAY[0,1,2,3,4,5,6]),
  ('Limpar Cozinha', 'Limpar bancadas e fogão', 30, 'daily', ARRAY[0,1,2,3,4,5,6]),
  ('Aspirar Carpete', 'Passar aspirador nos carpetes', 35, 'weekly', ARRAY[0]),
  ('Regar Plantas', 'Regar todas as plantas da casa', 15, 'weekly', ARRAY[0,3]);

-- Example rewards
INSERT INTO rewards (nome, descricao, custo_pontos, is_active) VALUES
  ('Escolher o Filme', 'Escolher o filme da noite sem discussão', 100, true),
  ('Jantar Favorito', 'Pedir para fazer seu prato favorito', 150, true),
  ('Dia Livre', 'Um dia sem fazer nenhuma tarefa doméstica', 500, true),
  ('Massagem nas Costas', '15 minutos de massagem relaxante', 200, true),
  ('Café na Cama', 'Café da manhã servido na cama', 250, true),
  ('Controle da TV', 'Controlar a TV o dia inteiro', 80, true),
  ('Escolher Restaurante', 'Escolher onde pedir comida', 120, true),
  ('Sobremesa Especial', 'Fazer/comprar uma sobremesa especial', 180, true);

-- Instructions for adding actual data:
-- 
-- 1. Create two user accounts via your app's login/signup
-- 2. Get their UUIDs from Supabase dashboard:
--    SQL Editor > Run: SELECT id, email FROM auth.users;
-- 3. Optionally add historical data:
--
-- Example for adding task history (replace UUIDs):
-- INSERT INTO tasks_history (task_id, user_id, xp_earned, completed_at) VALUES
--   (
--     (SELECT id FROM tasks_master WHERE nome = 'Lavar Louça' LIMIT 1),
--     'your-user-uuid-here',
--     20,
--     NOW() - INTERVAL '1 day'
--   );
--
-- This will automatically update the user's total_points via trigger

-- Add comments
COMMENT ON COLUMN tasks_master.days_of_week IS 'Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6';

