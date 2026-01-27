-- Reemplaza 'tu_email@ejemplo.com' con el email del usuario que quieres convertir en Administrador

UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'tu_email@ejemplo.com';

-- Verificar el cambio
SELECT * FROM public.profiles WHERE role = 'ADMIN';
