
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

module.exports = {
  MUTATION_CLEAR_AND_INSERT_PEOPLE,
  MUTATION_DELETE_CONSTITUENCIES,
  MUTATION_INSERT_CONSTITUENCIES,
  MUTATION_DELETE_COUNCILORS,
  MUTATION_INSERT_COUNCILORS
};
