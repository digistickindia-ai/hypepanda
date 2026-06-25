-- ===== Collaborations: managed request → quote → coordinate flow =====
-- Run in Supabase SQL Editor (safe to re-run). Extends the collaborations table.

alter table collaborations add column if not exists title text;            -- campaign title
alter table collaborations add column if not exists deliverables text;     -- what brand wants delivered
alter table collaborations add column if not exists budget_range text;     -- optional, free text (e.g. "10-15k")
alter table collaborations add column if not exists timeline text;         -- optional deadline / timeline free text

-- Creator's quotation (submitted in-app by the creator)
alter table collaborations add column if not exists quote_amount int;      -- creator's quoted price (INR)
alter table collaborations add column if not exists quote_note text;       -- creator's note with the quote
alter table collaborations add column if not exists quoted_at timestamptz; -- when the creator quoted

-- Richer status flow for the managed model:
-- requested  -> brand submitted the request, team notified
-- quoted     -> creator submitted a quotation, team to review
-- confirmed  -> team reviewed & pushed to brand, collaboration agreed
-- completed  -> work delivered / done
-- cancelled  -> cancelled at any stage
-- (existing 'in_progress' rows remain valid; treated like 'confirmed')

-- Allow the CREATOR to update their own collaboration row, but only the
-- quotation fields + move status to 'quoted'. (Admin update policy already exists.)
drop policy if exists "creator submits quote" on collaborations;
create policy "creator submits quote" on collaborations for update to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());
