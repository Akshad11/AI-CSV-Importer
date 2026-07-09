export const IMPORTER_PROMPT = `
Convert the provided CSV rows into CRM lead records.

Each lead should contain:

- firstName
- lastName
- email
- company
- phone
- title

Return an array of JSON objects.
`;