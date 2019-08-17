CREATE TABLE public.dcd_candidates (
    id SERIAL,
    year integer NOT NULL,
    cacode text NOT NULL,
    candidate_number numeric,
    occupation text NOT NULL,
    is_won boolean,
    votes integer DEFAULT 0,
    people_id integer NOT NULL,
    vote_percentage numeric DEFAULT 0,
    camp text
);
CREATE TABLE public.dcd_constituencies (
    id SERIAL,
    code text,
    name_zh text,
    expected_population integer,
    deviation_percentage numeric,
    boundaries jsonb DEFAULT '[]'::jsonb NOT NULL,
    main_areas jsonb DEFAULT '[]'::jsonb NOT NULL,
    year integer,
    name_en text
);
CREATE TABLE public.dcd_constituency_geometries (
    id SERIAL NOT NULL,
    constituency_id integer NOT NULL,
    polygon public.geometry
);
CREATE TABLE public.dcd_constituency_vote_station_stats (
    id SERIAL NOT NULL,
    constituency_id integer NOT NULL,
    station_code text NOT NULL,
    name_zh text,
    name_en text,
    year integer NOT NULL
);
CREATE TABLE public.dcd_constituency_vote_station_votes (
    id SERIAL,
    gender text DEFAULT 'male'::text NOT NULL,
    age text DEFAULT '18-20'::text NOT NULL,
    stat_id integer NOT NULL,
    votes integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.dcd_constituency_vote_stats (
    id SERIAL NOT NULL,
    constituency_id integer,
    population_excluded_foreign_worker integer DEFAULT 0 NOT NULL,
    population_excluded_foreign_worker_lte_age_15 integer DEFAULT 0 NOT NULL,
    population_excluded_foreign_worker_lte_age_20 integer DEFAULT 0 NOT NULL,
    total_voters integer DEFAULT 0 NOT NULL,
    total_voted_voters integer DEFAULT 0 NOT NULL,
    total_votes integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.dcd_people (
    id SERIAL NOT NULL,
    name_zh text,
    name_en text,
    estimated_yob integer,
    gender text NOT NULL
);
CREATE TABLE public.dcd_people_political_affiliations (
    id SERIAL NOT NULL,
    person_id integer NOT NULL,
    political_affiliation_id integer NOT NULL,
    year_from date NOT NULL,
    year_to date NOT NULL
);
CREATE TABLE public.dcd_political_affiliation_camps (
    id SERIAL NOT NULL,
    name_zh text NOT NULL
);
CREATE TABLE public.dcd_political_affiliations (
    id SERIAL NOT NULL,
    name_en text,
    name_zh text,
    established_at date,
    camp_id integer
);

ALTER TABLE ONLY public.dcd_constituencies
    ADD CONSTRAINT dcd_boundaries_code_year_key UNIQUE (code, year);
ALTER TABLE ONLY public.dcd_constituencies
    ADD CONSTRAINT dcd_boundaries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_people
    ADD CONSTRAINT dcd_candidate_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidate_pkey1 PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidates_people_id_year_cacode_key UNIQUE (people_id, year, cacode);
ALTER TABLE ONLY public.dcd_constituency_geometries
    ADD CONSTRAINT dcd_constituency_geometries_constituency_id_key UNIQUE (constituency_id);
ALTER TABLE ONLY public.dcd_constituency_vote_station_stats
    ADD CONSTRAINT dcd_constituency_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_constituency_vote_station_stats
    ADD CONSTRAINT dcd_constituency_metrics_station_code_year_key UNIQUE (station_code, year);
ALTER TABLE ONLY public.dcd_constituency_geometries
    ADD CONSTRAINT dcd_constituency_polygons_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_constituency_vote_stats
    ADD CONSTRAINT dcd_constituency_vote_stats_constituency_id_key UNIQUE (constituency_id);
ALTER TABLE ONLY public.dcd_constituency_vote_stats
    ADD CONSTRAINT dcd_constituency_vote_stats_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_constituency_vote_station_votes
    ADD CONSTRAINT dcd_constituency_votes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_constituency_vote_station_votes
    ADD CONSTRAINT dcd_constituency_votes_stat_id_gender_age_key UNIQUE (stat_id, gender, age);
ALTER TABLE ONLY public.dcd_people
    ADD CONSTRAINT dcd_people_name_zh_name_en_estimated_yob_key UNIQUE (name_zh, name_en, estimated_yob);
ALTER TABLE ONLY public.dcd_people_political_affiliations
    ADD CONSTRAINT dcd_people_political_affiliati_person_id_political_affiliati_key UNIQUE (person_id, political_affiliation_id, year_from, year_to);
ALTER TABLE ONLY public.dcd_people_political_affiliations
    ADD CONSTRAINT dcd_people_political_affiliations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_political_affiliation_camps
    ADD CONSTRAINT dcd_political_affiliation_camps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_political_affiliations
    ADD CONSTRAINT dcd_political_affiliation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_political_affiliations
    ADD CONSTRAINT dcd_political_affiliations_name_en_key UNIQUE (name_en);
ALTER TABLE ONLY public.dcd_political_affiliations
    ADD CONSTRAINT dcd_political_affiliations_name_zh_key UNIQUE (name_zh);

ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidate_people_id_fkey FOREIGN KEY (people_id) REFERENCES public.dcd_people(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidates_cacode_year_fkey FOREIGN KEY (cacode, year) REFERENCES public.dcd_constituencies(code, year) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.dcd_constituency_vote_station_stats
    ADD CONSTRAINT dcd_constituency_metrics_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.dcd_constituency_geometries
    ADD CONSTRAINT dcd_constituency_polygons_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE SET NULL ON DELETE SET NULL;
ALTER TABLE ONLY public.dcd_constituency_vote_stats
    ADD CONSTRAINT dcd_constituency_vote_stats_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.dcd_constituency_vote_station_votes
    ADD CONSTRAINT dcd_constituency_votes_metric_id_fkey FOREIGN KEY (stat_id) REFERENCES public.dcd_constituency_vote_station_stats(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.dcd_people_political_affiliations
    ADD CONSTRAINT dcd_people_political_affiliations_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.dcd_people(id) ON UPDATE SET NULL ON DELETE SET NULL;
ALTER TABLE ONLY public.dcd_people_political_affiliations
    ADD CONSTRAINT dcd_people_political_affiliations_political_affiliation_id_fkey FOREIGN KEY (political_affiliation_id) REFERENCES public.dcd_political_affiliations(id) ON UPDATE SET NULL ON DELETE SET NULL;
ALTER TABLE ONLY public.dcd_political_affiliations
    ADD CONSTRAINT dcd_political_affiliations_camp_id_fkey FOREIGN KEY (camp_id) REFERENCES public.dcd_political_affiliation_camps(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

