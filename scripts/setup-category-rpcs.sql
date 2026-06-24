-- One-time setup for category scripts (publishable key only).
-- Paste into Supabase Dashboard → SQL Editor → Run.

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
  transaction_count bigint
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
    COUNT(DISTINCT t.id) AS transaction_count
  FROM public.categories c
  LEFT JOIN public.transactions t ON t.category_id = c.id
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

CREATE OR REPLACE FUNCTION public.add_expense_categories(p_categories jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  existing_id uuid;
  next_sort int;
  created jsonb := '[]'::jsonb;
  skipped jsonb := '[]'::jsonb;
  new_id uuid;
  cat_name text;
  cat_icon text;
  cat_color text;
BEGIN
  IF p_categories IS NULL OR jsonb_typeof(p_categories) <> 'array' THEN
    RAISE EXCEPTION 'p_categories must be a JSON array';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_categories)
  LOOP
    cat_name := trim(item->>'name');
    cat_icon := nullif(trim(item->>'icon'), '');
    cat_color := nullif(trim(item->>'color'), '');

    IF cat_name IS NULL OR cat_name = '' THEN
      CONTINUE;
    END IF;

    SELECT c.id
    INTO existing_id
    FROM public.categories c
    WHERE c.type = 'expense' AND lower(c.name) = lower(cat_name)
    LIMIT 1;

    IF existing_id IS NOT NULL THEN
      skipped := skipped || jsonb_build_array(
        jsonb_build_object(
          'name', cat_name,
          'id', existing_id,
          'reason', 'already_exists'
        )
      );
      CONTINUE;
    END IF;

    SELECT COALESCE(MAX(c.sort_order), 0) + 1
    INTO next_sort
    FROM public.categories c
    WHERE c.type = 'expense';

    INSERT INTO public.categories (name, type, icon, color, is_system, sort_order)
    VALUES (cat_name, 'expense', cat_icon, cat_color, true, next_sort)
    RETURNING id INTO new_id;

    created := created || jsonb_build_array(
      jsonb_build_object(
        'id', new_id,
        'name', cat_name,
        'icon', cat_icon,
        'color', cat_color,
        'sort_order', next_sort
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'created', created,
    'skipped', skipped,
    'created_count', jsonb_array_length(created),
    'skipped_count', jsonb_array_length(skipped)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_expense_categories(jsonb) TO anon, authenticated;
