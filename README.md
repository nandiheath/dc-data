# dc-data

the schema and scripts to export the data

## Import data

- [how to import data](./importer/README.md)

## Setup hasura schema

### Install Hasura CLI

https://docs.hasura.io/1.0/graphql/manual/hasura-cli/install-hasura-cli.html

### Run Migration

Enable PostGIS before running the migrations
Navigate to hasura console and run the following SQL
```sql
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
```

```bash
cd hasura

# config
vi config.yaml

# check migration status
hasura migrate status

# run migration
hasura migrate apply
```