-- Limpiar mesas existentes
DELETE FROM public.resources WHERE type = 'TABLE_ROW';

-- Insertar 60 Mesas con ID explicito
DO $$
BEGIN
   FOR r IN 1..30 LOOP
      -- Fila A
      INSERT INTO public.resources (id, name, type, capacity) 
      VALUES (gen_random_uuid(), 'Mesa A-' || LPAD(r::text, 2, '0'), 'TABLE_ROW', 2);
      
      -- Fila B
      INSERT INTO public.resources (id, name, type, capacity) 
      VALUES (gen_random_uuid(), 'Mesa B-' || LPAD(r::text, 2, '0'), 'TABLE_ROW', 2);
   END LOOP;
END $$;
