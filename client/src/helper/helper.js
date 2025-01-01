
export const convertToCellFormat = (data) => {
    const convertedData = data?.map(row => ({
        cells: row.map(cell => {
            let value = cell || '';
            const style = {};

            if (typeof value !== 'string') {
                value = String(value);
            }

            if (value.includes('<b>')) {
                style.fontWeight = 'bold';
                value = value.replace(/<\/?b>/g, '');
            }
            if (value.includes('<i>')) {
                style.fontStyle = 'italic';
                value = value.replace(/<\/?i>/g, '');
            }
            if (value.includes('<u>')) {
                style.textDecoration = 'underline';
                value = value.replace(/<\/?u>/g, '');
            }

            return { value, style };
        })
    }));

    return convertedData;
};
