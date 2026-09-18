CREATE TYPE run_status AS ENUM (
  'queued',
  'running',
  'succeeded',
  'failed'
);

CREATE TABLE runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(256) NOT NULL,
  kind varchar(128) NOT NULL,
  status run_status NOT NULL DEFAULT 'queued',
  owner varchar(320),
  creator varchar(320) NOT NULL,
  external_ref varchar(256),
  parent_run_id uuid REFERENCES runs(id),
  root_run_id uuid REFERENCES runs(id),
  priority integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 1,
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX runs_status_idx ON runs (status);
CREATE INDEX runs_queue_idx ON runs (status, priority DESC, created_at) WHERE status = 'queued';
CREATE INDEX runs_owner_idx ON runs (owner);
CREATE INDEX runs_creator_idx ON runs (creator);
CREATE INDEX runs_external_ref_idx ON runs (external_ref);
CREATE INDEX runs_parent_run_id_idx ON runs (parent_run_id);
CREATE INDEX runs_root_run_id_idx ON runs (root_run_id);

CREATE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER runs_set_updated_at
BEFORE UPDATE ON runs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
