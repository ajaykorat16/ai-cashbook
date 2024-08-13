import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-grids/styles/material.css';
import '@syncfusion/ej2-react-spreadsheet/styles/material.css';
import React, { useEffect, useState, useRef } from 'react';
import ClientListLayout from '../components/ClientListLayout'
import { SheetsDirective, SheetDirective, RangesDirective, RangeDirective, SpreadsheetComponent } from '@syncfusion/ej2-react-spreadsheet';
import { useClient } from '../contexts/ClientContexts';
import Loader from '../components/Loader';

const Accounts = ({ clientId, showSelection }) => {
    const spreadsheetRef = useRef(null);
    const { getClientCategory, updateClientCatrgory } = useClient();

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getSheetData = async () => {
        if (spreadsheetRef.current) {
            try {
                const sheet = spreadsheetRef.current.getActiveSheet();
                const rowCount = sheet.usedRange.rowIndex + 1;
                const colCount = sheet.usedRange.colIndex + 1;
                const range = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;

                const data = await spreadsheetRef.current.getData(`${sheet.name}!${range}`);
                const formattedData = convertData(data);
                return formattedData
            } catch (error) {
                console.error('Error fetching sheet data:', error);
            }
        }
    };

    const convertData = (data) => {
        const result = [];
        const rows = new Set();
        const cols = new Set();

        data.forEach((value, key) => {
            const col = key.charAt(0);
            const row = parseInt(key.substring(1), 10) - 1;
            rows.add(row);
            cols.add(col);
        });

        const sortedRows = Array.from(rows).sort((a, b) => a - b);
        const sortedCols = Array.from(cols).sort();

        sortedRows.forEach(() => result.push([]));

        data.forEach((value, key) => {
            const col = key.charAt(0);
            const row = parseInt(key.substring(1), 10) - 1;
            const colIndex = sortedCols.indexOf(col);
            const cellValue = value.value || '';
            result[row][colIndex] = cellValue;
        });

        return result;
    };

    const convertToCellFormat = (data) => {
        const convertedData = data?.map(row => ({
            cells: row.map(cell => ({ value: cell }))
        }));
        return convertedData
    };

    const handleCellSave = async () => {
        const formattedData = await getSheetData()
        await updateClientCatrgory(clientId, formattedData);
    }

    const fetchCsvLoaded = async () => {
        setIsLoading(true)
        const csvDetail = await getClientCategory(clientId);
        const csv = csvDetail?.data || []
        const convertedData = convertToCellFormat(csv);

        if (spreadsheetRef?.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            sheet.rows = convertedData;
            spreadsheetRef.current.refresh();
        }
        setTimeout(() => {
            setDataLoaded(true);
        }, 1000);
        setIsLoading(false)
    }

    useEffect(() => {
        if (clientId) {
            fetchCsvLoaded()
        }
    }, [clientId])

    useEffect(() => {
        if (dataLoaded) {
            getSheetData()
        }
    }, [dataLoaded])

    return (
        <div>
            <ClientListLayout showSelection={showSelection}>
                <div className="special_flex mb-25">
                    <h1 className="main_title">Chart of accounts</h1>
                    <div className="right_flex">
                        <button className="common_btn ms-4">Import</button>
                    </div>
                </div>
                {clientId && (
                    <>
                        {isLoading && (
                            <Loader />
                        )}

                        <div className={`account_sheet ${isLoading ? "hidden" : ""}`}>
                            <SpreadsheetComponent
                                ref={spreadsheetRef}
                                cellSave={handleCellSave}
                                showSheetTabs = {false}
                            >
                                <SheetsDirective>
                                    <SheetDirective >
                                        <RangesDirective>
                                            <RangeDirective ></RangeDirective>
                                        </RangesDirective>
                                    </SheetDirective>
                                </SheetsDirective>
                            </SpreadsheetComponent>
                        </div>
                    </>
                )}
            </ClientListLayout>
        </div>

    )
}


export default Accounts