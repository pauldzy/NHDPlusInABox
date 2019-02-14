#/bin/sh

# Check if tblspdata volume with nhdplus_data tablespace exists and if so then skip the init step
if [ -d "/tblspdata/nhdplus_data" ]
then
   echo "<><><><><><>"
   echo "  preexisting nhdplus_data tablespace found in volume."
   echo "  skipping database initialization."
   echo "<><><><><><>"
   
else
   mkdir -p /tblspdata/nhdplus_data
   mkdir -p /tblspdata/ow_ephemeral

   sed -i -e "s/^#listen_addresses =.*$/listen_addresses = '*'/" /var/lib/postgresql/data/postgresql.conf
   sed -i -e "s/^#logging_collector = off/logging_collector = on/" /var/lib/postgresql/data/postgresql.conf

   mem=`awk '/MemTotal/ {print $2}' /proc/meminfo`
   sed -i -e "s/^#wal_buffers = -1.*$/wal_buffers = 16MB/" /var/lib/postgresql/data/postgresql.conf
   sed -i -e "s/^#min_wal_size = 80MB.*$/min_wal_size = 4GB/" /var/lib/postgresql/data/postgresql.conf
   sed -i -e "s/^#max_wal_size = 1GB.*$/max_wal_size = 8GB/" /var/lib/postgresql/data/postgresql.conf
   sed -i -e "s/^#checkpoint_completion_target = 0.5.*$/checkpoint_completion_target = 0.9/" /var/lib/postgresql/data/postgresql.conf

   echo "host    all    all    0.0.0.0/0    md5" >> /var/lib/postgresql/data/pg_hba.conf

   psql -c "CREATE USER dz_lrs               WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER nhdplus              WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER nhdplus_delineation  WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER nhdplus_navigation30 WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER nhdplus_watersheds   WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER nhdplus_indexing     WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER nhdplus_toponet      WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER waterspg             WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER waterspg_support     WITH PASSWORD '${POSTGRES_PASSWORD}';"
   psql -c "CREATE USER sde                  WITH PASSWORD 'sde123unused123';"

   psql -c "CREATE TABLESPACE nhdplus_data OWNER nhdplus LOCATION '/tblspdata/nhdplus_data';"
   psql -c "GRANT CREATE ON TABLESPACE nhdplus_data TO PUBLIC;"
   psql -c "CREATE TABLESPACE ow_ephemeral OWNER nhdplus LOCATION '/tblspdata/ow_ephemeral';"
   psql -c "GRANT CREATE ON TABLESPACE ow_ephemeral TO PUBLIC;"

   psql -c "CREATE DATABASE nhdplus;"
   psql -c "CREATE EXTENSION intarray;" nhdplus
   psql -c "CREATE EXTENSION hstore;" nhdplus
   psql -c "CREATE EXTENSION \"uuid-ossp\";" nhdplus
   psql -c "CREATE EXTENSION postgis;" nhdplus
   psql -c "CREATE EXTENSION postgis_topology;" nhdplus
   psql -c "CREATE EXTENSION pgrouting;" nhdplus

   psql -c "ALTER DATABASE nhdplus OWNER TO nhdplus;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO dz_lrs;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO nhdplus;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO nhdplus_delineation;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO nhdplus_navigation30;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO nhdplus_watersheds;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO nhdplus_indexing;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO nhdplus_toponet;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO waterspg;"
   psql -c "GRANT CREATE ON DATABASE nhdplus TO waterspg_support;"

   psql -c "GRANT ALL ON TABLE public.spatial_ref_sys TO nhdplus;" nhdplus
   psql -c "CREATE SCHEMA loading_dock AUTHORIZATION nhdplus;" nhdplus
   psql -c "CREATE SCHEMA waterspg AUTHORIZATION waterspg;" nhdplus
   psql -c "ALTER SCHEMA waterspg OWNER TO waterspg;" nhdplus
   psql -c "ALTER SCHEMA topology OWNER TO nhdplus_toponet;" nhdplus

   psql -c "CREATE FUNCTION waterspg.test() RETURNS JSON AS \$\$ BEGIN RETURN json_object_agg('works',TRUE); END; \$\$ LANGUAGE 'plpgsql';" nhdplus
   psql -c "ALTER FUNCTION waterspg.test() OWNER TO waterspg;" nhdplus

fi

