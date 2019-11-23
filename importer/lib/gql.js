
const MUTATION_CLEAR_AND_INSERT_PEOPLE = `
mutation insert_data($objects: [dcd_people_insert_input!]!){
  delete_dcd_people(where:{}) {
    affected_rows
  }

  insert_dcd_people(objects: $objects) {
    affected_rows
  }
}
`;

const MUTATION_DELETE_CONSTITUENCIES = `
mutation delate_data{
  delete_dcd_constituencies(where:{}) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_CONSTITUENCIES = `
mutation insert_data($objects: [dcd_constituencies_insert_input!]!){
  insert_dcd_constituencies(objects: $objects) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_CONSTITUENCY_TAGS = `
mutation insert_data($objects: [dcd_constituency_tag_insert_input!]!){
  insert_dcd_constituency_tag(objects: $objects) {
    affected_rows
  }
}
`;

const MUTATION_DELETE_CONSTITUENCY_PREDECESSORS = `
mutation delate_data{
  delete_dcd_constituency_predecessors(where:{}) {
    affected_rows
  }
}`;

const MUTATION_INSERT_CONSTITUENCY_PREDECESSORS = `
mutation insert_data($objects: [dcd_constituency_predecessors_insert_input!]!){
  insert_dcd_constituency_predecessors(objects: $objects) {
    affected_rows
  }
}`;


const MUTATION_DELETE_CONSTITUENCY_VOTE_STATS = `
mutation delate_data{
  delete_dcd_constituency_vote_stats(where:{}) {
    affected_rows
  }
}`;

const MUTATION_INSERT_CONSTITUENCY_VOTE_STATS = `
mutation insert_data($objects: [dcd_constituency_vote_stats_insert_input!]!){
  insert_dcd_constituency_vote_stats(objects: $objects) {
    affected_rows
  }
}`;

const MUTATION_DELETE_COUNCILORS = `
mutation delate_data{
  delete_dcd_councillors(where:{}) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_COUNCILORS = `
mutation insert_data($objects: [dcd_councillors_insert_input!]!){
  insert_dcd_councillors(objects: $objects) {
    affected_rows
  }
}
`;

const MUTATION_DELETE_COUNCILOR_ATTENDACES = `
mutation delate_data{
  delete_dcd_councillor_meetings(where:{}) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_COUNCILOR_ATTENDANCES = `
mutation insert_data($objects: [dcd_councillor_meeting_attendances_insert_input!]!){
  insert_dcd_councillor_meeting_attendances(objects: $objects) {
    affected_rows
  }
}
`;


const MUTATION_DELETE_CANDIDATES = `
mutation delate_data{
  delete_dcd_candidates(where:{}) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_CANDIDATES = `
mutation insert_data($objects: [dcd_candidates_insert_input!]!){
  insert_dcd_candidates(objects: $objects) {
    affected_rows
  }
}
`;

const MUTATION_DELETE_VOTE_STATIONS = `
mutation delate_data{
  delete_dcd_constituency_vote_stations(where:{}) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_VOTE_STATIONS = `
mutation insert_data($objects: [dcd_constituency_vote_stations_insert_input!]!){
  insert_dcd_constituency_vote_stations(objects: $objects) {
    affected_rows
  }
}
`;


const MUTATION_DELETE_DISTRICTS = `
mutation delate_data{
  delete_dcd_districts(where:{}) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_DISTRICTS = `
mutation insert_data($objects: [dcd_districts_insert_input!]!){
  insert_dcd_districts(objects: $objects) {
    affected_rows
  }
}
`;

const MUTATION_UPDATE_PERSON = `
mutation ($personId: Int!, $updateInput:dcd_people_set_input!){
  update_dcd_people(where: {id : {_eq: $personId}}
  _set: $updateInput) {
    affected_rows
  }
}`;


const MUTATION_UPDATE_CANDIDATE = `
mutation delete_tag($candidateId: Int!, $updateInput:dcd_candidates_set_input!, $tags: [dcd_candidate_tags_insert_input!]!){
  delete_dcd_candidate_tags(where:{
    candidate_id: {_eq: $candidateId}
  }) {
    affected_rows
  }
  update_dcd_candidates(where: {id : {_eq: $candidateId}}
  _set: $updateInput) {
    affected_rows
  }
  insert_dcd_candidate_tags(objects: $tags) {
    affected_rows
  }
}`;

const MUTATION_UPDATE_CONSTITUENCY = `
mutation ($constituencyId: Int!, $updateInput:dcd_constituencies_set_input!){
  update_dcd_constituencies(where: {id : {_eq: $constituencyId}}
  _set: $updateInput) {
    affected_rows
  }
}`;

const MUTATION_UPDATE_CONFIG = `
mutation update_config($key: String!, $value: jsonb!) {
  insert_dcd_config(objects:{
    key: $key,
    value: $value
  } on_conflict:{
    constraint: dcd_config_pkey
    update_columns: [value]
  }) {
    affected_rows
  } 
}`;

module.exports = {
  MUTATION_CLEAR_AND_INSERT_PEOPLE,
  MUTATION_DELETE_CONSTITUENCIES,
  MUTATION_INSERT_CONSTITUENCIES,
  MUTATION_INSERT_CONSTITUENCY_TAGS,
  MUTATION_DELETE_COUNCILORS,
  MUTATION_INSERT_COUNCILORS,
  MUTATION_DELETE_CANDIDATES,
  MUTATION_INSERT_CANDIDATES,
  MUTATION_DELETE_VOTE_STATIONS,
  MUTATION_INSERT_VOTE_STATIONS,
  MUTATION_DELETE_COUNCILOR_ATTENDACES,
  MUTATION_INSERT_COUNCILOR_ATTENDANCES,
  MUTATION_DELETE_DISTRICTS,
  MUTATION_INSERT_DISTRICTS,
  MUTATION_DELETE_CONSTITUENCY_PREDECESSORS,
  MUTATION_INSERT_CONSTITUENCY_PREDECESSORS,
  MUTATION_UPDATE_PERSON,
  MUTATION_UPDATE_CANDIDATE,
  MUTATION_UPDATE_CONSTITUENCY,
  MUTATION_DELETE_CONSTITUENCY_VOTE_STATS,
  MUTATION_INSERT_CONSTITUENCY_VOTE_STATS,
  MUTATION_UPDATE_CONFIG,
};
