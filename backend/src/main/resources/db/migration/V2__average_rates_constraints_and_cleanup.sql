-- Create average_rates table if it doesn't already exist (already present in dev DB)
CREATE TABLE IF NOT EXISTS public.average_rates (
    id                        integer NOT NULL DEFAULT nextval('average_rates_id_seq'),
    municipality_id           integer,
    avg_water_rate            double precision,
    avg_sewer_rate            double precision,
    avg_combined_total_rate   double precision,
    last_information_found_year integer DEFAULT 2023,
    CONSTRAINT average_rates_pkey PRIMARY KEY (id),
    CONSTRAINT average_rates_municipality_id_fkey
        FOREIGN KEY (municipality_id) REFERENCES public.municipalities(id)
);

CREATE SEQUENCE IF NOT EXISTS public.average_rates_id_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- Enforce one average-rate record per municipality
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_average_rates_municipality'
    ) THEN
        ALTER TABLE public.average_rates
            ADD CONSTRAINT uq_average_rates_municipality UNIQUE (municipality_id);
    END IF;
END $$;

-- Remove actual-rate table entries for municipalities that are average-only.
-- These municipalities have data only in average_rates and should not appear
-- in water_rates, sewer_rates, rate_variances, or sewer_rate_variance.
DELETE FROM public.rate_variances
WHERE municipality_id IN (SELECT municipality_id FROM public.average_rates);

DELETE FROM public.sewer_rate_variance
WHERE municipality_id IN (SELECT municipality_id FROM public.average_rates);

DELETE FROM public.water_rates
WHERE municipality_id IN (SELECT municipality_id FROM public.average_rates);

DELETE FROM public.sewer_rates
WHERE municipality_id IN (SELECT municipality_id FROM public.average_rates);
