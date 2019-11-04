# Scripts

## Setup

copy the `.env-sample` to `.env`
and set the corresponding env vars

## Download data

make sure you download the latest csv from master data sheet
save the file with the sheet name at `csv/`

## Import the data to hasura

Export the district data to csv
`./cli.js import csv`

## Import the nominate data

The script will download the data from `https://www.elections.gov.hk/dc2019/chi/nominat2.html`, compare with the data inside `./csv/dcd_candidates.csv` and `./csv/dcd_people.csv`, and compare also with `hkfactcheck`. This will generate intermediate csv files (default: `./intermediate/`), and after that will upload the data to master spreadsheet.

First you will need to get the `credentials.json` and put it under `./importer`
https://developers.google.com/sheets/api/quickstart/nodejs

Then run the command
`./cli.js nominate csv intermediate`

## Update candidates

This function is created for updating the 2019 candidates. Theoretically works for older year but not yet tested throughly. The script will automatically fetch the data from master data spreadsheet and import to hasura.

### Restrictions

- only for `dcd_candidates` and `dcd_people` are updated
- cannot update candidate_id nor person_id
- cannot update the assoicated constituencies
- will update the `dcd_candidate_tags` as well

### Usage

```bash
./cli.js update candidates [candidate_id_from] [candidate_id_to]

# example
# if you want to update candidate id 5379 only
./cli.js update candidates 5379 5379

# if you want to update all 2019 candidates
./cli.js update candidates 4406 5503
```

## Update constituencies

This function is created for updating the constituencies. The script will automatically fetch the data from master data spreadsheet and import to hasura.

### Restrictions

- only for `dcd_constituencies`
- only support description field now

### Usage

```bash
./cli.js update constituencies [constituency_id_from] [constituency_id_to]

# example
# if you want to update constituency id 2230 only
./cli.js update constituencies 2230 2230

# if you want to update all 2019 constituencies
./cli.js update constituencies 2039 2490
```
