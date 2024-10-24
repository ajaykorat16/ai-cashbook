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
import dayjs from 'dayjs';
import Layout from './Layout';
import { DropDownList } from '@syncfusion/ej2-dropdowns';

const itrList = ['1.1-FBT Contribution', '1.1-Gross distribution from trusts', '1.1-Gross Income', '1.1-Gross Interest', '1.1-Total Dividends',
    '1.9-Gov Subsidies', '2.1 - Opening Stock', '2.2-Cost of Sales', '2.3 - Closing Stock', '2.4-40-880 Deduction', '2.4-Contractor fees', '2.4-Superannuation expense',
    '2.5-Interest paid Australia', '2.5-Interest paid Overseas', '2.5-Rent', '5.1-Depreciation', '2.6-Lease payments Australia', '5.1-Depreciation', '5.2-MV Expenses',
    '5.3-Repair and Maintenance', '9.1-All Other Expenses', '9.3-Director Fees', '9.2-Non Deductible Expenses']

const SheetComponent = ({ clientId, sheetLoading, setSheetLoading }) => {
    const { getSpreadsheet, updateSpreadsheet, getClientCategory } = useClient();
    const spreadsheetRef = useRef(null);

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const currentYearStart = dayjs().startOf('year');
    const currentYearEnd = dayjs().endOf('year');
    const [fromDate, setFromDate] = useState(currentYearStart);
    const [toDate, setToDate] = useState(currentYearEnd);
    const [categortList, setCategoryList] = useState([])
    const [categoryData, setCategoryData] = useState({});
    const [categoryHeaders, setCategoryHeaders] = useState({});

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
        const csvDetail = await getSpreadsheet(clientId, fromDate.format('YYYY-MM-DD'), toDate.format('YYYY-MM-DD'));
        const csv = csvDetail || []
        const convertedData = convertToCellFormat(csv);

        if (spreadsheetRef?.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            sheet.rows = convertedData;
            spreadsheetRef.current.refresh();
        }
        setSheetLoading(true)
        await delay(3500);
        setDataLoaded(true);
    }

    useEffect(() => {
        if (clientId && !sheetLoading) {
            fetchCsvLoaded();
        }
    }, [clientId, sheetLoading]);

    useEffect(() => {
        if (dataLoaded) {
            formateSheet();
            applyFilterOnColumn('B');
            applyCalculations()
            setDataLoaded(false);
        }
    }, [dataLoaded]);

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
            return cellValue ? cellValue : '';
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
                if (args.action === 'cellDelete') {
                    const [firstAddress, secondAddress] = cellAddress.split('!')[1].split(":");
                    const firstRowNumber = parseInt(firstAddress.match(/\d+/)[0], 10);
                    const secondRowNumber = parseInt(secondAddress.match(/\d+/)[0], 10);

                    for (let row = firstRowNumber; row <= secondRowNumber; row++) {
                        const currentRowData = convertCellsToValues(sheet.rows[row - 1]);
                        editedData.push(currentRowData);
                    }
                } else {
                    const cellAddressWithoutSheet = cellAddress.split('!')[1];

                    const rowNumberMatch = cellAddressWithoutSheet.match(/\d+/);
                    const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
                    const editedRow = convertCellsToValues(sheet.rows[rowIndex - 1])
                    editedData.push(editedRow)
                }
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
                const firstRowNumber = parseInt(firtstAddress.match(/\d+/)[0], 10);
                const secondRowNumber = parseInt(secondAddress.match(/\d+/)[0], 10);

                for (let row = firstRowNumber; row <= secondRowNumber; row++) {
                    const currentRowData = convertCellsToValues(sheet.rows[row - 1]);
                    editedData.push(currentRowData);
                }
            }
            if (editedData?.length > 0) {
                const data = await updateSpreadsheet(clientId, editedData);

                if (data?.insertedDataId.length > 0) {
                    if (args?.eventArgs?.address && args.action !== 'cellDelete') {
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
        }
    };

    const applyCalculations = () => {
        if (spreadsheetRef.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const rowCount = sheet.usedRange.rowIndex + 1;

            for (let row = 2; row <= rowCount; row++) {
                const formula = `=IF(AND(ISNUMBER(D${row}), ISNUMBER(F${row})), ROUND((D${row}*F${row})/100, 2), "")`;
                spreadsheetRef.current.updateCell({ formula }, `G${row}`);

                const gstFormula = `=IF(ISNUMBER(G${row}), ROUND(G${row}/11, 2), "")`;
                spreadsheetRef.current.updateCell({ formula: gstFormula }, `J${row}`);

                const excGstFormula = `=IF(AND(ISNUMBER(G${row}), ISNUMBER(J${row})), ROUND(G${row}-J${row}, 2), "")`;
                spreadsheetRef.current.updateCell({ formula: excGstFormula }, `K${row}`);

                const baslabnFormula = `=IF(ISNUMBER(J${row}), IF(J${row} > 0, "1A", "1B"), "")`;
                spreadsheetRef.current.updateCell({ formula: baslabnFormula }, `O${row}`);
            }

            spreadsheetRef.current.refresh();
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

                applyGstDropdown()
                applyBasLabN()
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

    const applyGstDropdown = async () => {
        if (spreadsheetRef.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const rowCount = sheet.usedRange.rowIndex + 1;
            const dropdownRange = `H2:H${rowCount}`;
            const gstList = ['BAS Excluded', 'GST Free Expenses', 'GST Free Income', 'GST on Expenses', 'GST on Income']
            const data = gstList.join(',')

            await spreadsheetRef.current.addDataValidation({
                type: 'List',
                operator: 'InBetween',
                value1: data,
                ignoreBlank: false
            }, dropdownRange);
        }
    };

    const applyBasLabN = async () => {
        if (spreadsheetRef.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const rowCount = sheet.usedRange.rowIndex + 1;
            const dropdownRange = `O2:O${rowCount}`;
            const labN = ['1A', '1B']
            const data = labN.join(',')

            await spreadsheetRef.current.addDataValidation({
                type: 'List',
                operator: 'InBetween',
                value1: data,
                ignoreBlank: false
            }, dropdownRange);
        }
    };

    const fetchClientCategory = async () => {
        const { data } = await getClientCategory(clientId);
        const headers = data.shift();
        headers.splice(0, 1)
        const removeHtmlTags = (text) => {
            return text.replace(/<[^>]*>/g, '');
        };

        const cleanedHeaders = headers.map(removeHtmlTags);
        setCategoryHeaders(cleanedHeaders);

        const newArray = data.map(subArray => {
            if (!subArray[1] || !subArray[2] || !subArray[3]) {
                return null;
            }

            const cleanedFirstElement = subArray[0]
                .replace(/<\/?b>/g, '')
                .replace(/<\/?i>/g, '')
                .replace(/<\/?u>/g, '');

            return cleanedFirstElement;
        }).filter(Boolean);
        setCategoryList(newArray)

        const categoryMap = data.reduce((acc, subArray) => {
            const cleanedCategory = subArray[0].replace(/<\/?b>/g, '').replace(/<\/?i>/g, '').replace(/<\/?u>/g, '');
            if (subArray[2] && subArray[3] && subArray[4]) {
                acc[cleanedCategory] = subArray.slice(1);
                return acc;
            }
        }, {});

        setCategoryList(Object.keys(categoryMap));
        setCategoryData(categoryMap);
    };


    useEffect(() => {
        if (clientId) {
            fetchClientCategory()
        }
    }, [clientId])

    const numberToAlphabet = (num) => {
        let temp;
        let letter = '';

        while (num > 0) {
            temp = (num - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            num = Math.floor((num - temp) / 26);
        }

        return letter;
    };

    const handleDropdown = async (cellAddress, value) => {
        const sheet = spreadsheetRef.current.getActiveSheet();
        const rowNumberMatch = cellAddress.match(/\d+/);
        const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
        const editedRow = convertCellsToValues(sheet.rows[rowIndex - 1])
        if (editedRow && editedRow.length >= 4) {
            editedRow[4] = value;
        }
        await updateSpreadsheet(clientId, [editedRow]);
    }

    const handleCellRender = (args) => {
        const columnLetter = numberToAlphabet(args.colIndex + 1);
        const rowNumber = args.rowIndex + 1;
        const sheet = spreadsheetRef.current.getActiveSheet();
        const rowCount = sheet.usedRange.rowIndex + 1;

        if (columnLetter === 'N' && args.rowIndex > 0 && args.rowIndex < rowCount) {
            itrDropdown(args, columnLetter, rowNumber)
        }

        if (columnLetter === 'E' && args.rowIndex > 0 && args.rowIndex < rowCount) {
            const selectElement = document.createElement('select');
            selectElement.style.width = '100%';

            categortList.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                selectElement.appendChild(option);
            });

            selectElement.value = args.cell?.value || '';

            selectElement.onchange = async (event) => {
                const selectedValue = event.target.value;
                const cellAddress = `${columnLetter}${rowNumber}`;

                spreadsheetRef.current.updateCell({ value: selectedValue }, cellAddress);

                const headings = convertCellsToValues(sheet.rows[0]);
                const removeHtmlTags = (text) => text.replace(/<[^>]*>/g, '');
                const headers = headings.map(removeHtmlTags);

                const matchingValues = headers.filter(header =>
                    categoryHeaders.includes(header)
                );
                const correspondingData = categoryData[selectedValue];

                if (matchingValues.length > 0 && correspondingData) {
                    const rowIndexMatch = cellAddress.match(/\d+/);
                    const rowIndex = rowIndexMatch ? parseInt(rowIndexMatch[0], 10) : null;

                    matchingValues.forEach(value => {
                        const index = headers.indexOf(value);
                        const address = `${numberToAlphabet(index + 1)}${rowIndex}`;

                        const categoryHeaderIndex = categoryHeaders.indexOf(value);
                        const headerValue = correspondingData[categoryHeaderIndex];

                        if (headerValue && spreadsheetRef.current) {
                            try {
                                spreadsheetRef.current.updateCell({ value: headerValue }, address);
                            } catch (error) {
                                console.error(`Error updating cell ${address}:`, error);
                            }
                        }
                    });
                }
                handleDropdown(cellAddress, selectedValue);
                formateSheet()
            };

            args.element.innerHTML = '';
            args.element.appendChild(selectElement);
        }
    };

    const itrDropdown = (args, columnLetter, rowNumber) => {
        const selectElement = document.createElement('select');
        selectElement.style.width = '100%';

        itrList.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });

        selectElement.value = args.cell?.value || '';

        selectElement.onchange = async (event) => {
            const selectedValue = event.target.value;
            const cellAddress = `${columnLetter}${rowNumber}`;

            spreadsheetRef.current.updateCell({ value: selectedValue }, cellAddress);
            handleDropdown(cellAddress, selectedValue);
        };

        args.element.innerHTML = '';
        args.element.appendChild(selectElement);
    }

    return (
        <div>
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
            </div>
            <>
                {isLoading && (
                    <Loader />
                )}
                <div className={`account_sheet spreadsheet ${isLoading && 'invisible'}`}>
                    <SpreadsheetComponent
                        ref={spreadsheetRef}
                        actionComplete={handleActionComplete}
                        beforeCellRender={handleCellRender}
                        showSheetTabs={false}
                        allowSorting={true}
                        allowFiltering={true}
                        selectionSettings={{
                            mode: 'Multiple'
                        }}
                        created={() => {
                            spreadsheetRef.current.selectRange('B1');
                        }}
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
        </div>
    );
};

export default SheetComponent;
