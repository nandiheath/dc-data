CREATE TABLE public.dcd_candidates (
    id integer NOT NULL,
    year integer NOT NULL,
    cacode text NOT NULL,
    candidate_number numeric,
    occupation text,
    is_won boolean,
    votes integer DEFAULT 0,
    person_id integer NOT NULL,
    vote_percentage numeric DEFAULT 0,
    camp text,
    election_type text DEFAULT 'ordinary'::text NOT NULL,
    age integer,
    political_affiliation text,
    constituency_id integer
);
CREATE SEQUENCE public.dcd_candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_candidates_id_seq OWNED BY public.dcd_candidates.id;
CREATE TABLE public.dcd_constituencies (
    id integer NOT NULL,
    code text,
    name_zh text,
    expected_population integer,
    deviation_percentage numeric,
    boundaries jsonb DEFAULT '[]'::jsonb NOT NULL,
    main_areas jsonb DEFAULT '[]'::jsonb NOT NULL,
    year integer,
    name_en text,
    district_id integer
);
CREATE SEQUENCE public.dcd_constituencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_constituencies_id_seq OWNED BY public.dcd_constituencies.id;
CREATE TABLE public.dcd_constituency_predecessors (
    id integer NOT NULL,
    constituency_id integer NOT NULL,
    previous_constituency_id integer NOT NULL,
    intersect_area numeric
);
CREATE SEQUENCE public.dcd_constituency_predecessors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_constituency_predecessors_id_seq OWNED BY public.dcd_constituency_predecessors.id;
CREATE TABLE public.dcd_constituency_tag (
    constituency_id integer NOT NULL,
    tag text NOT NULL,
    type text
);
CREATE TABLE public.dcd_constituency_vote_station_stats (
    id integer NOT NULL,
    station_id integer NOT NULL,
    type text NOT NULL,
    subtype text,
    category_1 text,
    category_2 text,
    count integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.dcd_constituency_vote_stations (
    id integer NOT NULL,
    constituency_id integer NOT NULL,
    station_code text NOT NULL,
    name_zh text,
    name_en text,
    year integer NOT NULL,
    location public.geometry
);
CREATE SEQUENCE public.dcd_constituency_vote_station_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_constituency_vote_station_stats_id_seq OWNED BY public.dcd_constituency_vote_stations.id;
CREATE SEQUENCE public.dcd_constituency_vote_station_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_constituency_vote_station_votes_id_seq OWNED BY public.dcd_constituency_vote_station_stats.id;
CREATE TABLE public.dcd_constituency_vote_stats (
    id integer NOT NULL,
    constituency_id integer,
    type text NOT NULL,
    subtype text,
    category_1 text,
    category_2 text,
    count integer DEFAULT 0 NOT NULL
);
CREATE SEQUENCE public.dcd_constituency_vote_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_constituency_vote_stats_id_seq OWNED BY public.dcd_constituency_vote_stats.id;
CREATE TABLE public.dcd_councillor_meeting_attendances (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    attended integer DEFAULT 0 NOT NULL,
    councilor_id integer NOT NULL,
    total integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.dcd_councillor_meetings (
    meet_name text NOT NULL,
    meet_type text NOT NULL,
    council_year integer NOT NULL,
    district_id integer NOT NULL,
    meet_year integer NOT NULL,
    id integer NOT NULL
);
CREATE TABLE public.dcd_councillors (
    id integer NOT NULL,
    term_from date,
    term_to date,
    person_id integer NOT NULL,
    capacity text DEFAULT '民選'::text NOT NULL,
    post text DEFAULT '議員'::text,
    career text,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    year integer NOT NULL,
    cacode text,
    political_affiliation text,
    services jsonb DEFAULT '[]'::jsonb NOT NULL,
    district_id integer,
    constituency_id integer
);
CREATE SEQUENCE public.dcd_councilor_meeting_attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_councilor_meeting_attendances_id_seq OWNED BY public.dcd_councillor_meeting_attendances.id;
CREATE SEQUENCE public.dcd_councilor_meetings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_councilor_meetings_id_seq OWNED BY public.dcd_councillor_meetings.id;
CREATE SEQUENCE public.dcd_councilors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_councilors_id_seq OWNED BY public.dcd_councillors.id;
CREATE TABLE public.dcd_districts (
    id integer NOT NULL,
    area_code text NOT NULL,
    area_name_zh text NOT NULL,
    area_name_en text NOT NULL,
    lc_code text NOT NULL,
    lc_name_zh text NOT NULL,
    lc_name_en text NOT NULL,
    dc_code text NOT NULL,
    dc_name_zh text NOT NULL,
    dc_name_en text NOT NULL
);
CREATE SEQUENCE public.dcd_districts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_districts_id_seq OWNED BY public.dcd_districts.id;
CREATE TABLE public.dcd_people (
    id integer NOT NULL,
    name_zh text,
    name_en text,
    related_organization text,
    estimated_yob integer,
    gender text,
    uuid uuid DEFAULT public.gen_random_uuid(),
    fc_uuid uuid
);
CREATE SEQUENCE public.dcd_people_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_people_id_seq OWNED BY public.dcd_people.id;
CREATE TABLE public.dcd_political_affiliations (
    id integer NOT NULL,
    name_en text,
    name_zh text
);
CREATE SEQUENCE public.dcd_political_affiliations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.dcd_political_affiliations_id_seq OWNED BY public.dcd_political_affiliations.id;
CREATE TABLE public.hal_atm_services (
    id integer NOT NULL,
    type jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE SEQUENCE public.hal_atm_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.hal_atm_services_id_seq OWNED BY public.hal_atm_services.id;
CREATE TABLE public.hal_atms (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    location public.geometry,
    bank_id integer NOT NULL,
    name jsonb DEFAULT '{}'::jsonb NOT NULL,
    phone_number integer,
    address jsonb DEFAULT '{}'::jsonb NOT NULL,
    opening_hours jsonb DEFAULT '{}'::jsonb
);
CREATE TABLE public.hal_atms_atm_services (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    atm_id uuid NOT NULL,
    atm_service_id integer NOT NULL
);
CREATE TABLE public.hal_bank (
    id integer NOT NULL,
    name jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE SEQUENCE public.hal_bank_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.hal_bank_id_seq OWNED BY public.hal_bank.id;
CREATE TABLE public.hmt_place_providers (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name text NOT NULL
);
CREATE TABLE public.hmt_places (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    name jsonb DEFAULT '{}'::jsonb NOT NULL,
    description jsonb DEFAULT '{}'::jsonb NOT NULL,
    address jsonb DEFAULT '{}'::jsonb NOT NULL,
    year_from integer DEFAULT 1800 NOT NULL,
    year_to integer DEFAULT 2999 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    ref_id text DEFAULT 'gen_rand_uuid()'::text NOT NULL,
    "providerId" uuid,
    location public.geometry DEFAULT '010100000000000000000000000000000000000000'::public.geometry
);
ALTER TABLE ONLY public.dcd_candidates ALTER COLUMN id SET DEFAULT nextval('public.dcd_candidates_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_constituencies ALTER COLUMN id SET DEFAULT nextval('public.dcd_constituencies_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_constituency_predecessors ALTER COLUMN id SET DEFAULT nextval('public.dcd_constituency_predecessors_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_constituency_vote_station_stats ALTER COLUMN id SET DEFAULT nextval('public.dcd_constituency_vote_station_votes_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_constituency_vote_stations ALTER COLUMN id SET DEFAULT nextval('public.dcd_constituency_vote_station_stats_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_constituency_vote_stats ALTER COLUMN id SET DEFAULT nextval('public.dcd_constituency_vote_stats_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_councillor_meeting_attendances ALTER COLUMN id SET DEFAULT nextval('public.dcd_councilor_meeting_attendances_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_councillor_meetings ALTER COLUMN id SET DEFAULT nextval('public.dcd_councilor_meetings_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_councillors ALTER COLUMN id SET DEFAULT nextval('public.dcd_councilors_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_districts ALTER COLUMN id SET DEFAULT nextval('public.dcd_districts_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_people ALTER COLUMN id SET DEFAULT nextval('public.dcd_people_id_seq'::regclass);
ALTER TABLE ONLY public.dcd_political_affiliations ALTER COLUMN id SET DEFAULT nextval('public.dcd_political_affiliations_id_seq'::regclass);

ALTER TABLE ONLY public.dcd_constituencies
    ADD CONSTRAINT dcd_boundaries_code_year_key UNIQUE (code, year);
ALTER TABLE ONLY public.dcd_constituencies
    ADD CONSTRAINT dcd_boundaries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_people
    ADD CONSTRAINT dcd_candidate_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidate_pkey1 PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidates_people_id_year_cacode_key UNIQUE (person_id, year, cacode);
ALTER TABLE ONLY public.dcd_constituency_vote_stations
    ADD CONSTRAINT dcd_constituency_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_constituency_vote_stations
    ADD CONSTRAINT dcd_constituency_metrics_station_code_year_key UNIQUE (station_code, year);
ALTER TABLE ONLY public.dcd_constituency_predecessors
    ADD CONSTRAINT dcd_constituency_predecessors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_constituency_tag
    ADD CONSTRAINT dcd_constituency_tag_pkey PRIMARY KEY (constituency_id, tag);
ALTER TABLE ONLY public.dcd_constituency_vote_stats
    ADD CONSTRAINT dcd_constituency_vote_stats_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_constituency_vote_station_stats
    ADD CONSTRAINT dcd_constituency_votes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_councillor_meeting_attendances
    ADD CONSTRAINT dcd_councilor_meeting_attendances_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_councillor_meetings
    ADD CONSTRAINT dcd_councilor_meetings_meet_name_meet_type_meet_year_district_i UNIQUE (meet_name, meet_type, meet_year, district_id);
ALTER TABLE ONLY public.dcd_councillor_meetings
    ADD CONSTRAINT dcd_councilor_meetings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_councillors
    ADD CONSTRAINT dcd_councilors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_districts
    ADD CONSTRAINT dcd_districts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_people
    ADD CONSTRAINT dcd_people_name_zh_name_en_estimated_yob_key UNIQUE (name_zh, name_en, estimated_yob);
ALTER TABLE ONLY public.dcd_political_affiliations
    ADD CONSTRAINT dcd_political_affiliation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.dcd_political_affiliations
    ADD CONSTRAINT dcd_political_affiliations_name_en_key UNIQUE (name_en);
ALTER TABLE ONLY public.dcd_political_affiliations
    ADD CONSTRAINT dcd_political_affiliations_name_zh_key UNIQUE (name_zh);
ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidate_people_id_fkey FOREIGN KEY (person_id) REFERENCES public.dcd_people(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_candidates
    ADD CONSTRAINT dcd_candidates_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_constituencies
    ADD CONSTRAINT dcd_constituencies_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.dcd_districts(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_constituency_vote_stations
    ADD CONSTRAINT dcd_constituency_metrics_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_constituency_predecessors
    ADD CONSTRAINT dcd_constituency_predecessors_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_constituency_predecessors
    ADD CONSTRAINT dcd_constituency_predecessors_previous_constituency_id_fkey FOREIGN KEY (previous_constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_constituency_tag
    ADD CONSTRAINT dcd_constituency_tag_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_constituency_vote_station_stats
    ADD CONSTRAINT dcd_constituency_vote_station_votes_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.dcd_constituency_vote_stations(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_constituency_vote_stats
    ADD CONSTRAINT dcd_constituency_vote_stats_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_councillor_meeting_attendances
    ADD CONSTRAINT dcd_councilor_meeting_attendances_councilor_id_fkey FOREIGN KEY (councilor_id) REFERENCES public.dcd_councillors(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_councillor_meeting_attendances
    ADD CONSTRAINT dcd_councilor_meeting_attendances_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.dcd_councillor_meetings(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_councillor_meetings
    ADD CONSTRAINT dcd_councilor_meeting_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.dcd_districts(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_councillors
    ADD CONSTRAINT dcd_councilors_constituency_id_fkey FOREIGN KEY (constituency_id) REFERENCES public.dcd_constituencies(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_councillors
    ADD CONSTRAINT dcd_councilors_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.dcd_districts(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.dcd_councillors
    ADD CONSTRAINT dcd_councilors_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.dcd_people(id) ON UPDATE CASCADE ON DELETE CASCADE;
