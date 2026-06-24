-- Run this in Supabase SQL Editor if you already ran setup-category-rpcs.sql earlier.

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
