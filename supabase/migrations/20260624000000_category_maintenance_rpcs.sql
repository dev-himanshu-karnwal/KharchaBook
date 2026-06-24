-- RPC helpers for local category scripts using the publishable key only.
-- Runs with elevated privileges so scripts can read usage and prune system categories.

CREATE OR REPLACE FUNCTION public.list_categories_with_usage()
RETURNS TABLE (
  id uuid,
  name text,
  type text,
  icon text,
  color text,
  is_system boolean,
  sort_order int,
  user_id uuid,
  created_at timestamptz,
  transaction_count bigint,
  recurring_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.type,
    c.icon,
    c.color,
    c.is_system,
    c.sort_order,
    c.user_id,
    c.created_at,
    COUNT(DISTINCT t.id) AS transaction_count,
    COUNT(DISTINCT r.id) AS recurring_count
  FROM public.categories c
  LEFT JOIN public.transactions t ON t.category_id = c.id
  LEFT JOIN public.recurring_transactions r ON r.category_id = c.id
  GROUP BY c.id
  ORDER BY c.type, c.sort_order, c.name;
$$;

CREATE OR REPLACE FUNCTION public.prune_unused_categories(p_apply boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  unused jsonb;
  deleted_count int;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'type', c.type,
        'is_system', c.is_system,
        'sort_order', c.sort_order
      )
      ORDER BY c.type, c.sort_order, c.name
    ),
    '[]'::jsonb
  )
  INTO unused
  FROM public.categories c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.category_id = c.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.recurring_transactions r WHERE r.category_id = c.id
  );

  IF NOT p_apply THEN
    RETURN jsonb_build_object(
      'dry_run', true,
      'total_categories', (SELECT COUNT(*)::int FROM public.categories),
      'in_use_count', (SELECT COUNT(*)::int FROM public.categories) - jsonb_array_length(unused),
      'unused_count', jsonb_array_length(unused),
      'unused', unused
    );
  END IF;

  DELETE FROM public.categories c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.category_id = c.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.recurring_transactions r WHERE r.category_id = c.id
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'dry_run', false,
    'deleted_count', deleted_count,
    'deleted', unused
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_categories_with_usage() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_unused_categories(boolean) TO anon, authenticated;
