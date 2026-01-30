create table if not exists rules (
  id bigint generated always as identity primary key,
  rule_name text not null,
  code text not null
);

