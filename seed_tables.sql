-- Limpiar mesas existentes para evitar duplicados (opcional, seguro para dev)
DELETE FROM public.resources WHERE type = 'TABLE_ROW';

-- Insertar 60 Mesas (30 Fila A + 30 Fila B)
DO $$
BEGIN
   FOR r IN 1..30 LOOP
      -- Fila A
      INSERT INTO public.resources (name, type, capacity) 
      VALUES ('Mesa A-' || LPAD(r::text, 2, '0'), 'TABLE_ROW', 2);
      
      -- Fila B
      INSERT INTO public.resources (name, type, capacity) 
      VALUES ('Mesa B-' || LPAD(r::text, 2, '0'), 'TABLE_ROW', 2);
   END LOOP;
END $$;
