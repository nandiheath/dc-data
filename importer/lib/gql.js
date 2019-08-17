
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

const MUTATION_DELETE_COUNCILORS = `
mutation delate_data{
  delete_dcd_councilors(where:{}) {
    affected_rows
  }
}
`;

const MUTATION_INSERT_COUNCILORS = `
mutation insert_data($objects: [dcd_councilors_insert_input!]!){
  insert_dcd_councilors(objects: $objects) {
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


module.exports = {
  MUTATION_CLEAR_AND_INSERT_PEOPLE,
  MUTATION_DELETE_CONSTITUENCIES,
  MUTATION_INSERT_CONSTITUENCIES,
  MUTATION_DELETE_COUNCILORS,
  MUTATION_INSERT_COUNCILORS,
  MUTATION_DELETE_CANDIDATES,
  MUTATION_INSERT_CANDIDATES,
  MUTATION_DELETE_VOTE_STATIONS,
  MUTATION_INSERT_VOTE_STATIONS,
};
