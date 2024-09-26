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
import { SheetsDirective, SheetDirective, RangesDirective, RangeDirective, SpreadsheetComponent, ColumnsDirective, ColumnDirective } from '@syncfusion/ej2-react-spreadsheet';
import Loader from '../components/Loader';
import { useClient } from '../contexts/ClientContexts';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';


const SheetComponent = ({ clientId, showSelection }) => {
    const navigate = useNavigate();
    const { getSpreadsheet, updateSpreadsheet } = useClient();
    const { getUserCategory } = useAuth()
    const spreadsheetRef = useRef(null);

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const currentYearStart = dayjs().startOf('year');
    const currentYearEnd = dayjs().endOf('year');
    const [fromDate, setFromDate] = useState(currentYearStart);
    const [toDate, setToDate] = useState(currentYearEnd);
    const [categortList, setCategoryList] = useState([])

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

    const delay = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    const fetchCsvLoaded = async () => {
        setIsLoading(true)
        const csvDetail = await getSpreadsheet(clientId, fromDate.format('MM/DD/YYYY'), toDate.format('MM/DD/YYYY'));
        const csv = csvDetail || []
        const convertedData = convertToCellFormat(csv);

        if (spreadsheetRef?.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            sheet.rows = convertedData;
            spreadsheetRef.current.refresh();
        }
        await delay(3500);
        setDataLoaded(true);
    }

    useEffect(() => {
        if (clientId) {
            fetchCsvLoaded();
        }
    }, [clientId]);

    useEffect(() => {
        if (dataLoaded) {
            formateSheet();
            applyFilterOnColumn('B');
            setDefaultSelection()
            applyDropdown()
            setDataLoaded(false);
        }
    }, [dataLoaded]);

    const setDefaultSelection = () => {
        const inputElement = document.getElementById('spreadsheet_1836146846_0_name_box');
        if (inputElement) {
            inputElement.value = 'B1';
        }
    }

    const convertCellsToValues = (data) => {
        if (!data || !Array.isArray(data.cells)) {
            return [];
        }

        return data.cells.map((cell, index) => {
            let cellValue = cell?.value;
            const style = cell?.style || {};

            if (index === 2 && cellValue && !isNaN(cellValue)) {
                cellValue = convertSerialDateToDDMMYYYY(Number(cellValue));
            }

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
            return cellValue;
        });
    };


    const convertSerialDateToDDMMYYYY = (serialDate) => {
        if (typeof serialDate !== 'number' || isNaN(serialDate)) {
            throw new Error('Invalid serial date input');
        }

        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + (serialDate * 24 * 60 * 60 * 1000));

        const day = String(jsDate.getDate()).padStart(2, '0');
        const month = String(jsDate.getMonth() + 1).padStart(2, '0');
        const year = jsDate.getFullYear();

        return `${month}/${day}/${year}`;
    };

    const handleActionComplete = async (args) => {
        if (args.action === 'format' || args.action === 'cellSave' || args.action === 'clipboard' ||
            args.action === 'cellDelete' || args.action === 'delete' || args.action === 'insert') {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const editedData = []

            if (args?.eventArgs?.address) {
                const cellAddress = args.eventArgs.address
                const cellAddressWithoutSheet = cellAddress.split('!')[1];

                const rowNumberMatch = cellAddressWithoutSheet.match(/\d+/);
                const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
                const editedRow = convertCellsToValues(sheet.rows[rowIndex - 1])
                editedData.push(editedRow)
            } else if (args?.eventArgs?.modelType === 'Row') {
                if (args?.action === 'insert') {
                    editedData.push([])
                } else {
                    const sheetArgs = args?.eventArgs
                    const deletedRowId = sheetArgs.deletedModel[0].cells[0].value
                    editedData.push([deletedRowId])
                }
            } else if (args?.eventArgs?.modelType === 'Column') {
                for (let row = 0; row <= sheet.rows.length; row++) {
                    const currentRowData = convertCellsToValues(sheet.rows[row]);
                    editedData.push(currentRowData);
                }
            } else {
                let cellAddress
                if (args?.eventArgs?.pastedRange) {
                    cellAddress = args.eventArgs.pastedRange
                } else {
                    cellAddress = args.eventArgs.range
                }
                const [firtstAddress, secondAddress] = cellAddress.split('!')[1].split(":");
                const firstRowNumber = firtstAddress.match(/\d+/)[0];
                const secondRowNumber = secondAddress.match(/\d+/)[0];

                for (let row = firstRowNumber; row <= secondRowNumber; row++) {
                    const currentRowData = convertCellsToValues(sheet.rows[row - 1]);
                    editedData.push(currentRowData);
                }
            }
            if (editedData.length > 0) {
                const data = await updateSpreadsheet(clientId, editedData);

                if (data.insertedDataId.length > 0) {
                    if (args?.eventArgs?.address) {
                        const cellAddress = args.eventArgs.address
                        const cellAddressWithoutSheet = cellAddress.split('!')[1];

                        const rowNumberMatch = cellAddressWithoutSheet.match(/\d+/);
                        const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
                        spreadsheetRef.current.updateCell({ value: data.insertedDataId[0] }, `A${rowIndex}`);
                    } else if (args?.eventArgs?.requestType === 'paste') {
                        const cellAddress = args?.eventArgs?.selectedRange
                        const [firtstAddress, secondAddress] = cellAddress.split(":");
                        const firstRowNumber = firtstAddress.match(/\d+/)[0];
                        const secondRowNumber = secondAddress.match(/\d+/)[0];

                        let dataIndex = 0;
                        for (let rowIndex = firstRowNumber; rowIndex <= secondRowNumber; rowIndex++) {
                            if (dataIndex < data.insertedDataId.length) {
                                spreadsheetRef.current.updateCell({ value: data.insertedDataId[dataIndex] }, `A${rowIndex}`);
                                dataIndex++;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }
            formateSheet();
            applyDropdown()
        }
    };

    const formateSheet = () => {
        if (spreadsheetRef.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();

            if (sheet) {
                const colCount = sheet.usedRange.colIndex + 1;
                const rowCount = sheet.usedRange.rowIndex + 1;

                const firstRowRange = `B1:${String.fromCharCode(64 + colCount)}1`;
                spreadsheetRef.current.cellFormat({ fontWeight: 'bold', backgroundColor: '#4b5366', color: '#FFFFFF' }, firstRowRange);

                spreadsheetRef.current.autoFit(`B:${String.fromCharCode(64 + colCount)}`);

                spreadsheetRef.current.lockCells(`A1:A${rowCount}`, true);
                spreadsheetRef.current.hideColumn(0, 0);

                sheet.columns[0].allowResizing = false;

                const rangeToProtect = `A1:A${rowCount}`;
                spreadsheetRef.current.lockCells(rangeToProtect, true);

                const dateColumnRange = `C2:C${rowCount}`;
                // spreadsheetRef.current.numberFormat('dd/mm/yyyy', dateColumnRange);
                setIsLoading(false);
            }
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
            spreadsheetRef.current.refresh();
        }
    };

    const applyDropdown = () => {
        if (spreadsheetRef.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const rowCount = sheet.usedRange.rowIndex + 1;
            const dropdownRange = `F2:F${rowCount}`;
            spreadsheetRef.current.addDataValidation({
                type: 'List',
                operator: 'InBetween',
                value1: categortList.join(','),
                ignoreBlank: true
            }, dropdownRange);
        }
    };

    const fetchMasterCategory = async () => {
        const { data } = await getUserCategory()
        const newArray = data.map(subArray => {
            const cleanedFirstElement = subArray[0].replace(/<\/?b>/g, '').replace(/<\/?i>/g, '').replace(/<\/?u>/g, '');
            return cleanedFirstElement;
        });
        setCategoryList(newArray)
    }

    useEffect(() => {
        fetchMasterCategory()
    }, [])

    return (
        <div>
            <Layout showSelection={showSelection}>
                <div className="special_flex mb-25">
                    <div className='title_part'>
                        <div className='date_title'>
                            <span className="date_label">From:</span>
                            <span className='date_part'>{currentYearStart.format('DD/MM/YYYY')}</span>
                        </div>
                        <div className='date_title'>
                            <span className="date_label">To:</span>
                            <span className='date_part'>{toDate.format('DD/MM/YYYY')}</span>
                        </div>
                    </div>
                    {/* <div className="right_flex">
                        <button className="common_btn ms-4" onClick={() => navigate("/user/clients")}>Back to list</button>
                    </div> */}
                </div>
                {/* {clientId && ( */}
                <>
                    {isLoading && (
                        <Loader />
                    )}
                    <div className={`account_sheet spreadsheet ${isLoading && 'invisible'}`}>
                        <SpreadsheetComponent
                            ref={spreadsheetRef}
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
                                    <ColumnsDirective>
                                        <ColumnDirective width={0} allowResizing={false} headerText="ID" ></ColumnDirective>
                                    </ColumnsDirective>
                                </SheetDirective>
                            </SheetsDirective>
                        </SpreadsheetComponent>
                    </div>
                </>
                {/* )} */}
            </Layout>
        </div>
    );
};

export default SheetComponent;
