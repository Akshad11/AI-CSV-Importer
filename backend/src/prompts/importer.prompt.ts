export const IMPORTER_PROMPT = `
Convert the provided CSV rows into CRM lead records.

Each lead should contain:
- created_at: Lead creation date
- name: Lead name
- email: Primary email
- country_code: Country code
- mobile_without_country_code: Mobile number
- company: Company name
- city: City
- state: State
- country: Country
- lead_owner: Lead owner
- crm_status: Lead status (Must be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE)
- crm_note: Remarks/comments (Aggregates extra emails/phones or miscellaneous info)
- data_source: Source (Must be one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or blank)
- possession_time: Property possession time
- description: Additional description

AI Rules:
1. Skip the record if it contains neither an email address nor a mobile number.
2. Ensure created_at format can be parsed with new Date(created_at).
3. If multiple emails or mobile numbers exist, pick the first one and put the others in crm_note.
4. Keep each record on a single line, escaping line breaks with \\n.

Return an array of JSON objects.
`;