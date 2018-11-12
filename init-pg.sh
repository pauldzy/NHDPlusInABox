#/bin/sh

mkdir -p /home/postgres/.ssh
rm   -Rf /pgdata/nhdplus_data
rm   -Rf /pgdata/ow_ephemeral
find /workspace ! -name 'nfo.txt' -exec rm -Rf {} + || true
mkdir -p /pgdata/nhdplus_data
mkdir -p /pgdata/ow_ephemeral
chown -R postgres:postgres /home/postgres
chown -R postgres:postgres /pgdata/nhdplus_data
chown -R postgres:postgres /pgdata/ow_ephemeral

sed -i -e"s/^#listen_addresses =.*$/listen_addresses = '*'/" /var/lib/postgresql/data/postgresql.conf

echo "host    all    all    0.0.0.0/0    md5" >> /var/lib/postgresql/data/pg_hba.conf

psql -c "CREATE USER nhdplus              WITH PASSWORD '${POSTGRES_PASSWORD}';"
psql -c "CREATE USER nhdplus_delineation  WITH PASSWORD '${POSTGRES_PASSWORD}';"
psql -c "CREATE USER nhdplus_navigation30 WITH PASSWORD '${POSTGRES_PASSWORD}';"
psql -c "CREATE USER nhdplus_watersheds   WITH PASSWORD '${POSTGRES_PASSWORD}';"
psql -c "CREATE USER waterspg             WITH PASSWORD '${POSTGRES_PASSWORD}';"
psql -c "CREATE USER waterspg_support     WITH PASSWORD '${POSTGRES_PASSWORD}';"

psql -c "CREATE TABLESPACE nhdplus_data OWNER nhdplus LOCATION '/pgdata/nhdplus_data';"
psql -c "GRANT CREATE ON TABLESPACE nhdplus_data TO PUBLIC;"
psql -c "CREATE TABLESPACE ow_ephemeral OWNER nhdplus LOCATION '/pgdata/ow_ephemeral';"
psql -c "GRANT CREATE ON TABLESPACE ow_ephemeral TO PUBLIC;"

psql -c "CREATE DATABASE nhdplus;"
psql -c "ALTER DATABASE nhdplus OWNER TO nhdplus;"

psql -c "CREATE EXTENSION hstore;" nhdplus
psql -c "CREATE EXTENSION postgis;" nhdplus
psql -c "CREATE EXTENSION postgis_topology;" nhdplus
psql -c "CREATE EXTENSION pgrouting;" nhdplus

psql -c "GRANT ALL ON TABLE public.spatial_ref_sys TO nhdplus;" nhdplus
psql -c "CREATE SCHEMA loading_dock AUTHORIZATION nhdplus;" nhdplus
psql -c "CREATE SCHEMA waterspg AUTHORIZATION nhdplus;" nhdplus
psql -c "ALTER SCHEMA waterspg OWNER TO waterspg;" nhdplus

psql -c "CREATE FUNCTION waterspg.test() RETURNS JSON AS \$\$ BEGIN RETURN json_object_agg('works',TRUE); END; \$\$ LANGUAGE 'plpgsql';" nhdplus
psql -c "ALTER FUNCTION waterspg.test() OWNER TO waterspg;" nhdplus
