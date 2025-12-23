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
        const spreadsheet_id = config.spreadsheet_id || config.spreadsheetId;
        const sheet_name = config.sheet_name || config.sheetName;
        const { range } = config;

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
        const spreadsheet_id = config.spreadsheet_id || config.spreadsheetId;
        const sheet_name = config.sheet_name || config.sheetName;
        const { values } = config;

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
        const spreadsheet_id = config.spreadsheet_id || config.spreadsheetId;
        const sheet_name = config.sheet_name || config.sheetName;

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
    },

    /**
     * Update an existing row
     */
    async update_row(credentials, config) {
        const spreadsheet_id = config.spreadsheet_id || config.spreadsheetId;
        const sheet_name = config.sheet_name || config.sheetName;
        const row_number = config.row_number || config.rowNumber;
        const { values } = config;
        if (!spreadsheet_id || !row_number || !values) {
            throw new Error('Spreadsheet ID, row number, and values are required');
        }

        const range = `${sheet_name || 'Sheet1'}!A${row_number}:Z${row_number}`;
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
            {
                method: 'PUT',
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
            updated_range: data.updatedRange
        };
    },

    /**
     * Delete a row
     */
    async delete_row(credentials, config) {
        const spreadsheet_id = config.spreadsheet_id || config.spreadsheetId;
        const sheet_id = config.sheet_id || config.sheetId;
        const row_number = config.row_number || config.rowNumber;
        if (!spreadsheet_id || row_number === undefined) {
            throw new Error('Spreadsheet ID and row number are required');
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
                        deleteDimension: {
                            range: {
                                sheetId: sheet_id || 0,
                                dimension: 'ROWS',
                                startIndex: Number(row_number) - 1,
                                endIndex: Number(row_number)
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

        return { success: true };
    }
};
