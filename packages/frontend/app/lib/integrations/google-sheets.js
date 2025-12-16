/**
 * Google Sheets Integration
 * Actions: read_rows, append_row, create_sheet
 */

export const googleSheetsIntegration = {
    name: 'Google Sheets',

    /**
     * Read rows from a spreadsheet
     */
    async read_rows(credentials, config, context) {
        const { spreadsheet_id, sheet_name, range } = config;

        if (!spreadsheet_id) {
            throw new Error('Spreadsheet ID is required');
        }

        const sheetRange = range || `${sheet_name || 'Sheet1'}!A:Z`;

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(sheetRange)}`,
            {
                headers: {
                    'Authorization': `Bearer ${credentials.access_token}`
                }
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Sheets API error: ${error.error.message}`);
        }

        const data = await response.json();

        return {
            success: true,
            rows: data.values || [],
            row_count: (data.values || []).length
        };
    },

    /**
     * Append a row to a spreadsheet
     */
    async append_row(credentials, config, context) {
        const { spreadsheet_id, sheet_name, values } = config;

        if (!spreadsheet_id || !values) {
            throw new Error('Spreadsheet ID and values are required');
        }

        const sheetRange = `${sheet_name || 'Sheet1'}!A:Z`;

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(sheetRange)}:append?valueInputOption=USER_ENTERED`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [Array.isArray(values) ? values : [values]]
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Sheets API error: ${error.error.message}`);
        }

        const data = await response.json();

        return {
            success: true,
            updated_range: data.updates.updatedRange,
            updated_rows: data.updates.updatedRows
        };
    },

    /**
     * Create a new sheet in a spreadsheet
     */
    async create_sheet(credentials, config, context) {
        const { spreadsheet_id, sheet_name } = config;

        if (!spreadsheet_id || !sheet_name) {
            throw new Error('Spreadsheet ID and sheet name are required');
        }

        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheet_name
                            }
                        }
                    }]
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Google Sheets API error: ${error.error.message}`);
        }

        const data = await response.json();

        return {
            success: true,
            sheet_id: data.replies[0].addSheet.properties.sheetId,
            sheet_name: data.replies[0].addSheet.properties.title
        };
    }
};
