-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Crear enum para categorías
CREATE TYPE location_category AS ENUM (
    'acopio_necesidad',
    'acopio_lleno',
    'via_bloqueada',
    'peligro_estructural'
);

-- Crear tabla locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category location_category NOT NULL,
    description TEXT,
    latitude FLOAT8 NOT NULL,
    longitude FLOAT8 NOT NULL,
    supplies_status JSONB DEFAULT '{}'::jsonb,
    upvotes INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT now() + interval '12 hours',
    
    -- Validaciones
    CONSTRAINT latitude_range CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT longitude_range CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 100),
    CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

-- Índices para rendimiento
CREATE INDEX idx_locations_expires_at ON locations(expires_at);
CREATE INDEX idx_locations_category ON locations(category);
CREATE INDEX idx_locations_created_at ON locations(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Política de lectura: todos pueden leer reportes activos
CREATE POLICY "Lectura pública de reportes activos"
    ON locations
    FOR SELECT
    USING (expires_at > now());

-- Política de inserción: todos pueden crear reportes
CREATE POLICY "Inserción pública de reportes"
    ON locations
    FOR INSERT
    WITH CHECK (true);

-- Política de actualización: permitir cualquier UPDATE (la validación la hará un trigger)
CREATE POLICY "Actualización de reportes"
    ON locations
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Función trigger que valida que solo se incremente upvotes
CREATE OR REPLACE FUNCTION validate_update_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Verificar que upvotes se incremente exactamente en 1
    IF (NEW.upvotes <> OLD.upvotes + 1) THEN
        RAISE EXCEPTION 'Solo se permite incrementar upvotes en 1';
    END IF;

    -- 2. Verificar que ningún otro campo cambie (excepto updated_at, que lo maneja otro trigger)
    IF (NEW.title IS DISTINCT FROM OLD.title) OR
       (NEW.category IS DISTINCT FROM OLD.category) OR
       (NEW.description IS DISTINCT FROM OLD.description) OR
       (NEW.latitude IS DISTINCT FROM OLD.latitude) OR
       (NEW.longitude IS DISTINCT FROM OLD.longitude) OR
       (NEW.supplies_status IS DISTINCT FROM OLD.supplies_status) OR
       (NEW.expires_at IS DISTINCT FROM OLD.expires_at) THEN
        RAISE EXCEPTION 'Solo se permite actualizar el campo upvotes';
    END IF;

    -- Si todo ok, permitimos la operación
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta antes de cada UPDATE
CREATE TRIGGER validate_update_trigger
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION validate_update_fields();