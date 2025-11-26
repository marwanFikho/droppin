# Droppin Backend

## PDF Export Feature (Added Nov 24, 2025)
Admin users can export selected packages to a PDF containing:
- Tracking ID
- Destination (full delivery address)
- Customer name
- Customer phone
- Brand (shop business name)
- COD (EGP)
- Delivered? (Yes when status === 'delivered')

### Endpoint
POST /api/packages/export
Body: { "packageIds": [1,2,3] }
Auth: Admin JWT required.
Response: application/pdf attachment.

### Error Responses
- 400: Missing or empty packageIds array
- 403: Non-admin access
- 404: No matching packages found
- 500: Internal generation failure

### Implementation Notes
Uses `pdfkit` for server-side PDF generation and streams directly to the client. Page breaks automatically reprint table headers.

### Frontend Usage
On Admin Packages tab (sub-tab "all"), select packages and click "Export X to PDF".

### Future Improvements
- Include partial delivery statuses as a distinct column
- Optional CSV export
- Add delivered date column
- Batch size limits & async job for very large exports
