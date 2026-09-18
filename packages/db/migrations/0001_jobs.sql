CREATE TYPE job_status AS ENUM (
  'queued',
  'rejected',
  'in-progress',
  'completed',
  'canceled',
  'failed'
);

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(256) NOT NULL,
  kind varchar(128) NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  owner varchar(320),
  creator varchar(320) NOT NULL,
  external_ref varchar(256),
  parent_job_id uuid REFERENCES jobs(id),
  root_job_id uuid REFERENCES jobs(id),
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

CREATE INDEX jobs_status_idx ON jobs (status);
CREATE INDEX jobs_owner_idx ON jobs (owner);
CREATE INDEX jobs_creator_idx ON jobs (creator);
CREATE INDEX jobs_external_ref_idx ON jobs (external_ref);
CREATE INDEX jobs_parent_job_id_idx ON jobs (parent_job_id);
CREATE INDEX jobs_root_job_id_idx ON jobs (root_job_id);

CREATE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_set_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
