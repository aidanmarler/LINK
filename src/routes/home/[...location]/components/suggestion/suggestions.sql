create or replace function get_valid_and_user_suggestion(
  p_segment_id int8, 
  p_min_score int2,
  p_language "Language", 
  p_user_id uuid
)
returns table (
  valid_forward_id int8,
  valid_forward_text text,
  valid_forward_user uuid,
  valid_accepted_id int8,
  valid_accepted_step "TranslationStep",
  valid_accepted_score int2,
  user_forward_id int8,
  user_forward_text text
)
language plpgsql
stable
as $get_valid$
declare
  -- Store information on possible valid suggestion
  v_forward_id int8;
  v_forward_text text;
  v_forward_user uuid;
  v_forward_time timestamptz;
  v_accepted_id int8;
  v_accepted_step "TranslationStep";
  v_accepted_score int2;
  -- Store information on auxillary user-posed suggestion
  v_user_forward_id int8;
  v_user_forward_text text;
begin
  -- A. Get the most recent accepted_translation for this original_segment and language
  select a.id, a.score, a.translation_step, a.translation_id 
    into v_accepted_id, v_accepted_score, v_accepted_step, v_forward_id
  from accepted_translations a
  where a.original_id = p_segment_id
    and a.language = p_language
  order by a.created_at desc
  limit 1;
  
  -- B. Check if score > minimum score: Valid! Get that translation.
  if v_accepted_score is not null and v_accepted_score >= p_min_score then
    select f.user_id, f.translation, f.created_at
      into v_forward_user, v_forward_text, v_forward_time
    from forward_translations as f
    where f.id = v_forward_id;
  end if;

  -- C. Independently, check whether this user already has their own.
  --  If the first attempt was not valid, or if the user's is more 
  --  recent than the valid one: store it.
  select u.id, u.translation 
    into v_user_forward_id, v_user_forward_text 
  from forward_translations as u
  where u.original_id = p_segment_id
    and u.language = p_language
    and u.user_id = p_user_id
    and (v_forward_time is null or ( v_forward_id is distinct from u.id and u.created_at > v_forward_time))
  order by u.created_at desc
  limit 1;

  -- D. If the original one wasn't valid, reset it before pushing so it reads all as null.
  if v_accepted_score < p_min_score or v_accepted_score is null then
    v_forward_id := null;
    v_forward_text := null;
    v_forward_user := null;
    v_accepted_id := null;
    v_accepted_step := null;
    v_accepted_score := null;
  end if;

  -- E. Handle return
  return query
  select
    v_forward_id,
    v_forward_text,
    v_forward_user,
    v_accepted_id,
    v_accepted_step,
    v_accepted_score,
    v_user_forward_id,
    v_user_forward_text;
end;
$get_valid$;











create or replace function find_similar_segments(
  p_segment_id int8,
  p_user_id uuid,
  match_threshold float default 0.2,
  match_count int2 default 3,
  min_accepted_score int2 default 0,
  batch_size int2 default 10,
  max_batches int2 default 10
)
returns table (
  segment_id int8,
  segment_text text,
  score float,
  forward_translation_id int8,
  forward_translation_text text,
  accepted_translation_id int8,
  accepted_translation_step "TranslationStep",
  user_owned boolean
)
language plpgsql
as $find_similar$
declare
  v_segment_id int8;
  v_segment_text text;
  v_segment_hash text;
  v_user_language "Language";
  v_offset int2 := 0;
  v_batch int2 := 0;
  v_found int2 := 0;
begin
  select segment, segment_hash into v_segment_text, v_segment_hash
  from original_segments where id = p_segment_id;

  select language into v_user_language
  from profiles where id = p_user_id;

  create temporary table if not exists tmp_results (
    segment_id int8, 
    segment_text text, 
    score float,
    forward_translation_id int8, 
    forward_translation_text text,
    accepted_translation_id int8,
    accepted_translation_step "TranslationStep"
  ) on commit drop;
  truncate tmp_results;

  -- A. Get all exact matches
  insert into tmp_results (segment_id, segment_text, score, forward_translation_id, forward_translation_text, accepted_translation_id, accepted_translation_step)
  with matches as (
    select os.id, os.segment, g.*
    from original_segments os
    cross join lateral get_valid_and_user_suggestion(
      os.id, min_accepted_score, v_user_language, p_user_id
    ) g
    where os.id <> p_segment_id
      and os.segment_hash = v_segment_hash
  )
  select id, segment, 1.0::float, valid_forward_id, valid_forward_text, valid_accepted_id, valid_accepted_step
  from matches
  where valid_forward_id is not null

  union all

  select id, segment, 1.0::float, user_forward_id, user_forward_text, null, null
  from matches
  where user_forward_id is not null;  

  -- B. Fuzzy search in growing batches until enough, or out of tries
  --perform set_limit(match_threshold);
  select count(*) into v_found from tmp_results;
  while v_batch < max_batches and v_found < match_count loop

    insert into tmp_results (segment_id, segment_text, score, forward_translation_id, forward_translation_text, accepted_translation_id, accepted_translation_step)
    with candidates as (
      select os.id, os.segment, similarity(os.segment, v_segment_text) as sim
      from original_segments os
      where os.id <> p_segment_id
        and os.segment_hash <> v_segment_hash        -- skip exact matches, already handled
        and os.segment % v_segment_text            -- uses the GIN trigram index
      order by sim desc
      limit batch_size
      offset v_offset
    ),
    matches as (
      select c.id, c.segment, c.sim, g.*
      from candidates c
      cross join lateral get_valid_and_user_suggestion(
        c.id, min_accepted_score, v_user_language, p_user_id
      ) g
    )
    select id, segment, sim, valid_forward_id, valid_forward_text, valid_accepted_id, valid_accepted_step
    from matches
    where valid_forward_id is not null
      and sim >= match_threshold

    union all

    select id, segment, sim, user_forward_id, user_forward_text, null, null
    from matches
    where user_forward_id is not null
      and sim >= match_threshold;

    select count(*) into v_found from tmp_results;
    v_offset := v_offset + batch_size;
    v_batch := v_batch + 1;

  end loop;

-- C. Return the best of what we found, exact matches naturally ranked first (score 1.0)
return query
select
  d.segment_id,
  d.segment_text,
  d.score,
  d.forward_translation_id,
  d.forward_translation_text,
  d.accepted_translation_id,
  d.accepted_translation_step
from (
  select distinct on (md5(lower(trim(t.forward_translation_text))))
    t.segment_id, t.segment_text, t.score, t.forward_translation_id,
    t.forward_translation_text, t.accepted_translation_id, t.accepted_translation_step
  from tmp_results t
  order by md5(lower(trim(t.forward_translation_text))), t.score desc
) d
order by d.score desc
limit match_count;

end;
$find_similar$;







create or replace function find_similar_segments_old(
  p_segment_id int8,
  p_user_id uuid,
  match_threshold float default 0.7,
  match_count int default 3,
  min_accepted_score int default 2
) returns table (
  segment_id int8,
  segment_text text,
  score float
)
language sql stable
as $$
  with query_segment as (
    select segment from original_segments where id = p_segment_id
  ),
  user_language as (
    select language from profiles where id = p_user_id
  ),
  candidates as (
    select
      os.id as segment_id,
      os.segment as segment_text,
      similarity(os.segment, (select segment from query_segment)) as score
    from original_segments os
    where os.id <> p_segment_id
      and os.segment % (select segment from query_segment)
      and similarity(os.segment, (select segment from query_segment)) >= match_threshold
    order by score desc
    limit match_count
  ),
  select
    c.segment_id,
    c.segment_text,
    c.score
  from candidates c
  order by c.score desc;
$$;