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
import Layout from '../components/Layout';
import { SheetsDirective, SheetDirective, RangesDirective, RangeDirective, SpreadsheetComponent } from '@syncfusion/ej2-react-spreadsheet';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

const Accounts = ({ clientId, showSelection, getCsvData, updateCsvData, title }) => {
    const navigate = useNavigate();
    const spreadsheetRef = useRef(null);

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
                return formattedData;
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
            let cellValue = value?.value || '';

            const style = value?.style || {};
            if (Object.keys(style).length > 0 && cellValue) {
                if (style.fontWeight === 'bold') {
                    cellValue = `<b>${cellValue}</b>`;
                }
                if (style.fontStyle === 'italic') {
                    cellValue = `<i>${cellValue}</i>`;
                }
                if (style.textDecoration === 'underline') {
                    cellValue = `<u>${cellValue}</u>`;
                }
            }

            result[row][colIndex] = cellValue;
        });
        return result;
    };

    const convertToCellFormat = (data) => {
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

    const fetchCsvLoaded = async () => {
        setIsLoading(true);
        const csvDetail = await getCsvData(clientId);
        const csv = csvDetail?.data || [];
        const convertedData = convertToCellFormat(csv);

        if (spreadsheetRef?.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            sheet.rows = convertedData;
            spreadsheetRef.current.refresh();
        }
        setTimeout(() => {
            setDataLoaded(true);
        }, 1000);
    };

    useEffect(() => {
        if (clientId) {
            fetchCsvLoaded();
        }
    }, [clientId]);

    useEffect(() => {
        if (dataLoaded) {
            formateSheet()
            getSheetData();
            applyFilterOnColumn('A')
        }
    }, [dataLoaded]);

    const handleActionComplete = async (args) => {
        if (args.action === 'format' || args.action === 'cellSave' || args.action === 'clipboard' ||
            args.action === 'cellDelete' || args.action === 'delete' || args.action === 'insert') {
            const formattedData = await getSheetData();
            await updateCsvData(clientId, formattedData);
            formateSheet()
        }
    };

    const formateSheet = () => {
        if (spreadsheetRef.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const colCount = sheet.usedRange.colIndex + 1;
            const rowCount = sheet.usedRange.rowIndex + 1;

            const firstRowRange = `A1:${String.fromCharCode(64 + colCount)}1`;
            spreadsheetRef.current.cellFormat({ fontWeight: 'bold', backgroundColor: '#4b5366', color: '#FFFFFF' }, firstRowRange);

            spreadsheetRef.current.autoFit(`A:${String.fromCharCode(64 + colCount)}`);

            const range = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
            spreadsheetRef.current.cellFormat({ border: 'none', borderBottom: '1px solid #FFFFFF' }, range);

            const outerBorderRange = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
            spreadsheetRef.current.setBorder({ border: '1px solid #e0e0e0' }, outerBorderRange, 'Outer');

            const horizontalBorderRange = `A2:${String.fromCharCode(64 + colCount)}${rowCount}`;
            spreadsheetRef.current.setBorder({ border: '1px solid #e0e0e0' }, horizontalBorderRange, 'Horizontal');
            setIsLoading(false);
        }
    };

    const applyFilterOnColumn = (columnLetter) => {
        if (spreadsheetRef.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const colCount = sheet.usedRange.colIndex + 1;
            const rowCount = sheet.usedRange.rowIndex + 1;
            const range = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;

            spreadsheetRef.current.applyFilter(
                [{
                    field: columnLetter,
                    operator: 'notEqual',
                    value: ''
                }],
                range
            );
        }
    };
    return (
        <div>
            <Layout showSelection={showSelection}>
                <div className="special_flex mb-25">
                    <h1 className="main_title">{title}</h1>
                    <div className="right_flex">
                        <button className="common_btn ms-4" onClick={() => navigate("/user/clients")}>Back to list</button>
                    </div>
                </div>
                {clientId && (
                    <>
                        {isLoading && (
                            <Loader />
                        )}
                        <div className={`account_sheet ${isLoading ? "invisible" : ""}`}>
                            <SpreadsheetComponent
                                ref={spreadsheetRef}
                                showGridLines={false}
                                actionComplete={handleActionComplete}
                                showSheetTabs={false}
                                allowSorting={true}
                                allowFiltering={true}
                            >
                                <SheetsDirective>
                                    <SheetDirective frozenRows={1}>
                                        <RangesDirective>
                                            <RangeDirective></RangeDirective>
                                        </RangesDirective>
                                    </SheetDirective>
                                </SheetsDirective>
                            </SpreadsheetComponent>
                        </div>
                    </>
                )}
            </Layout>
        </div>
    );
};

export default Accounts;
