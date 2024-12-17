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
import { SheetsDirective, SheetDirective, RangesDirective, RangeDirective, SpreadsheetComponent, ColumnDirective, ColumnsDirective } from '@syncfusion/ej2-react-spreadsheet';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import ClientSelection from './ClientSelection';
import { useClient } from '../contexts/ClientContexts';
import { useAuth } from '../contexts/AuthContext';
import { groupData } from './data';

const Accounts = ({ clientId, showSelection, getCsvData, updateCsvData, title }) => {
    const navigate = useNavigate();
    const spreadsheetRef = useRef(null);
    const { clientObject } = useClient()
    const { toast } = useAuth()

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sheetData, setSheetData] = useState([])
    const [csvData, setCsvData] = useState([])
    const [readStatus, setReadStatus] = useState(false)

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

    const fetchCsv = async () => {
        const csvDetail = await getCsvData(clientId);
        const csv = csvDetail?.data || [];
        setCsvData(csv)
    }

    const fetchCsvLoaded = async () => {
        setIsLoading(true);
        try {
            const csvDetail = await getCsvData(clientId);
            const csv = csvDetail?.data || [];
            setCsvData(csv)
            const firstRow = csv[0]
            const headers = firstRow.map(item => item.replace(/<\/?[^>]+(>|$)/g, ""));
            const convertedData = convertToCellFormat(csv);

            convertedData.shift();
            let backendData = []

            if (convertedData.length === 0) {
                backendData = [{
                    "cells": [
                        {
                            "value": "",
                            "style": {}
                        },
                        {
                            "value": "",
                            "style": {}
                        },
                        {
                            "value": "",
                            "style": {}
                        },
                        {
                            "value": "",
                            "style": {}
                        },
                        {
                            "value": "",
                            "style": {}
                        }
                    ]
                }]
            } else {
                backendData = convertedData
            }

            const formattedData = backendData.map((c) => {
                const data = {};
                for (let i = 0; i < c.cells.length; i++) {
                    if (headers[i]) {
                        data[headers[i]] = c.cells[i].value;
                    }
                }
                return data;
            });

            setSheetData(formattedData);
            setDataLoaded(true)
        } catch (error) {
            console.error("Failed to load CSV data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchCsvLoaded();
        }
    }, [clientId]);

    const convertCellsToValues = (data) => {
        if (!data || !Array.isArray(data.cells)) {
            return [];
        }

        return data.cells.map((cell, index) => {
            let cellValue = cell?.value;
            const style = cell?.style || {};

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
            return cellValue ? cellValue : '';
        });
    };


    const handleActionComplete = async (args) => {
        const deletedCategory = []
        const updatedCategory = []
        handleDropdown();
        if ([
            'format',
            'cellSave',
            'clipboard',
            'cellDelete',
            'delete',
            'insert',
            'autofill',
        ].includes(args.action)) {
            const sheet = spreadsheetRef.current.getActiveSheet();

            if (args.action === 'cellSave') {
                const cellAddress = args.eventArgs.address;
                const [col, row] = [cellAddress.split('!')[1][0], parseInt(cellAddress.slice(1), 10)];
                const match = cellAddress.match(/\d+$/)
                const rowNumber = match ? parseInt(match[0], 10) : null;
                const currentRowData = convertCellsToValues(sheet.rows[rowNumber - 1]);
                const cellValue = args.eventArgs.displayText;
                const oldValue = args.eventArgs.oldValue

                if (!currentRowData[0] || currentRowData[0].trim() === ""
                    || !currentRowData[2] || !currentRowData[2].trim() === ""
                    || !currentRowData[3] || !currentRowData[3].trim() === ""
                ) {
                    const param1 = currentRowData[2] ? `${currentRowData[2]} ` : "";
                    const param2 = currentRowData[3] ? `${currentRowData[3]} ` : "";

                    if (sheet.rows.length === csvData.length) {
                        toast.current?.show({ severity: 'error', summary: 'Category', detail: 'You cannot remove rquired data.', life: 3000 })
                        spreadsheetRef.current.updateCell(
                            { value: args.eventArgs.oldValue },
                            cellAddress.split('!')[1]
                        );
                    }

                    return;
                }

                if (cellValue !== oldValue) {
                    updatedCategory.push([oldValue, cellValue])
                }
            }

            if (args.action === 'autofill') {
                const cellAddress = args.eventArgs.fillRange;
                const cellAddressWithoutSheet = cellAddress.split('!')[1];
                const rowNumberMatch = cellAddressWithoutSheet.match(/\d+/);
                const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
                const currentRowData = convertCellsToValues(sheet.rows[rowIndex - 1]);
            } else if (args?.eventArgs?.address) {
                const cellAddress = args.eventArgs.address;

                if (args.action == 'cellDelete') {
                    const [firstAddress, secondAddress] = cellAddress.split('!')[1].split(":");
                    const firstRowNumber = parseInt(firstAddress.match(/\d+/)[0], 10);
                    const secondRowNumber = parseInt(secondAddress.match(/\d+/)[0], 10);
                    let showToast = false

                    for (let row = firstRowNumber; row <= secondRowNumber; row++) {
                        const currentRowData = convertCellsToValues(sheet.rows[row - 1]);
                        if (currentRowData[0] === '' || !currentRowData[0]) {
                            const value = csvData[row - 1][0]
                            spreadsheetRef.current.updateCell(
                                { value },
                                `A${row}`
                            );
                            showToast = true
                        } else if (currentRowData[2] === '' || !currentRowData[2]) {
                            const value = csvData[row - 1][2]
                            spreadsheetRef.current.updateCell(
                                { value },
                                `C${row}`
                            );
                            showToast = true
                        } else if (currentRowData[3] === '' || !currentRowData[2]) {
                            const value = csvData[row - 1][3]
                            spreadsheetRef.current.updateCell(
                                { value },
                                `D${row}`
                            );
                            showToast = true
                        }
                    }

                    if (showToast) {
                        toast.current?.show({ severity: 'error', summary: 'Category', detail: 'You cannot remove rquired data.', life: 3000 })
                    }
                } else {
                    const cellAddressWithoutSheet = cellAddress.split('!')[1];
                    const rowNumberMatch = cellAddressWithoutSheet.match(/\d+/);
                    const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
                    const currentRowData = convertCellsToValues(sheet.rows[rowIndex - 1]);
                }
            } else if (args.action === 'delete') {
                const startIndex = args.eventArgs.startIndex
                const endIndex = args.eventArgs.endIndex

                for (let row = startIndex; row <= endIndex; row++) {
                    const currentRowData = csvData[row];
                    if (currentRowData[0]) {
                        deletedCategory.push(currentRowData[0])
                    } else if (currentRowData[2]) {
                        deletedCategory.push(currentRowData[2])
                    } else if (currentRowData[3]) {
                        deletedCategory.push(currentRowData[3])
                    }
                }
            } else {
                let cellAddress;
                if (args?.eventArgs?.pastedRange) {
                    cellAddress = args.eventArgs.pastedRange;
                } else {
                    cellAddress = args.eventArgs.range;
                }
                const [firstAddress, secondAddress] = cellAddress.split('!')[1].split(":");
                const firstRowNumber = parseInt(firstAddress.match(/\d+/)[0], 10);
                const secondRowNumber = parseInt(secondAddress.match(/\d+/)[0], 10);

                for (let row = firstRowNumber; row <= secondRowNumber; row++) {
                    const currentRowData = convertCellsToValues(sheet.rows[row - 1]);

                    if (row <= csvData.length) {
                        const oldRowData = csvData[row - 1];
                        if (currentRowData[0] !== oldRowData[0]) {
                            updatedCategory.push([oldRowData[0], currentRowData[0]])
                        }
                    }
                }
            }
            const formattedData = await getSheetData();
            await updateCsvData(clientId, formattedData, deletedCategory, updatedCategory);
            formateSheet();
            fetchCsv()
        }
    };


    const formateSheet = () => {
        try {
            if (spreadsheetRef.current) {
                const sheet = spreadsheetRef.current.getActiveSheet();
                const colCount = sheet.usedRange.colIndex + 1;
                const rowCount = sheet.usedRange.rowIndex + 1;

                const firstRowRange = `A1:${String.fromCharCode(64 + colCount)}1`;
                spreadsheetRef.current.cellFormat({ fontWeight: 'bold', backgroundColor: '#4b5366', color: '#FFFFFF' }, firstRowRange);

                // spreadsheetRef.current.autoFit(`A:${String.fromCharCode(64 + colCount)}`);

                // const range = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
                // spreadsheetRef.current.cellFormat({ border: 'none', borderBottom: '1px solid #FFFFFF' }, range);

                // const outerBorderRange = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
                // spreadsheetRef.current.setBorder({ border: '1px solid #e0e0e0' }, outerBorderRange, 'Outer');

                // const horizontalBorderRange = `A2:${String.fromCharCode(64 + colCount)}${rowCount}`;
                // spreadsheetRef.current.setBorder({ border: '1px solid #e0e0e0' }, horizontalBorderRange, 'Horizontal');
                setIsLoading(false);
            }
        } catch (error) {
            // console.log("error", error)
        }
    };

    useEffect(() => {
        const handleResize = () => {
            spreadsheetRef.current.refresh();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);


    const handleDropdown = () => {
        if (spreadsheetRef?.current?.isRendered === false) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const rowCount = sheet.usedRange.rowIndex + 1;
            const colCount = sheet.usedRange.colIndex + 1;

            const rangeItrLabel = `D2:D${rowCount}`;
            spreadsheetRef.current.addDataValidation(
                {
                    type: 'List',
                    inCellDropDown: true,
                    value1: '=ItrLabels!A2:A25',
                },
                rangeItrLabel
            );

            const rangeGst = `C2:C${rowCount}`;
            spreadsheetRef.current.addDataValidation(
                {
                    type: 'List',
                    inCellDropDown: true,
                    value1: '=ItrLabels!B2:B6',
                },
                rangeGst
            );
        }
    }

    useEffect(() => {
        if (readStatus) {
            spreadsheetRef.current.setRangeReadOnly(true, 'A1:Z1');
            setReadStatus(false)
        }
    }, [readStatus])

    return (
        <div>
            <Layout>
                <div className="special_flex d-flex justify-content-space-between">
                    <h1 className="main_title mb-0">{title}</h1>
                    {title !== 'Master Category' && <h1 className="main_title mb-0">{clientObject?.label}</h1>}
                    {showSelection && (
                        <ClientSelection className="head_select align-self-end" />
                    )}
                </div>
                <div className="right_flex mb-25 justify-content-end mt-3">
                    <button className="common_btn ms-4 back_to_list" onClick={() => navigate("/user/clients")}>Back To List</button>
                </div>
                {isLoading ? (
                    <Loader />) : (
                    <>
                        {dataLoaded && (<Loader />)}
                        <div className={`account_sheet spreadsheet account_height ${dataLoaded && 'invisible'}`}>
                            <SpreadsheetComponent
                                ref={spreadsheetRef}
                                actionComplete={handleActionComplete}
                                showSheetTabs={false}
                                allowSorting={true}
                                allowFiltering={true}
                                created={() => {
                                    if (spreadsheetRef?.current?.isRendered === false) {
                                        formateSheet();
                                        handleDropdown()
                                        getSheetData();
                                        setDataLoaded(false)
                                        setReadStatus(true)
                                    }
                                }}
                            >
                                <SheetsDirective>
                                    <SheetDirective frozenRows={1} name="Accounts">
                                        <RangesDirective>
                                            <RangeDirective dataSource={sheetData}></RangeDirective>
                                        </RangesDirective>
                                        <ColumnsDirective>
                                            <ColumnDirective width={300} allowResizing={false}  ></ColumnDirective>
                                            <ColumnDirective width={115} allowResizing={false} ></ColumnDirective>
                                            <ColumnDirective width={160} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={240} allowResizing={false} ></ColumnDirective>
                                            <ColumnDirective width={60} allowResizing={false} ></ColumnDirective>
                                        </ColumnsDirective>
                                    </SheetDirective>
                                    <SheetDirective name="ItrLabels">
                                        <RangesDirective>
                                            <RangeDirective dataSource={groupData}></RangeDirective>
                                        </RangesDirective>
                                    </SheetDirective>
                                </SheetsDirective>
                            </SpreadsheetComponent>
                        </div>
                    </>
                )}
            </Layout>
        </div >
    );
};

export default Accounts;
