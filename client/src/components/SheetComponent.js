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
import moment from 'moment';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.css';
import 'jquery-ui-dist/jquery-ui';
import ClientSelection from './ClientSelection';
import LoaderOverlay from './LoaderOverlay';

const itrList = ['1.1-FBT Contribution', '1.1-Gross distribution from trusts', '1.1-Gross Income', '1.1-Gross Interest', '1.1-Total Dividends',
    '1.9-Gov Subsidies', '2.1 - Opening Stock', '2.2-Cost of Sales', '2.3 - Closing Stock', '2.4-40-880 Deduction', '2.4-Contractor fees', '2.4-Superannuation expense',
    '2.5-Interest paid Australia', '2.5-Interest paid Overseas', '2.5-Rent', '5.1-Depreciation', '2.6-Lease payments Australia', '2.6-Lease payments Overseas', '5.1-Depreciation', '5.2-MV Expenses',
    '5.3-Repair and Maintenance', '9.1-All Other Expenses', '9.3-Director Fees', '9.2-Non Deductible Expenses']

const SheetComponent = ({ clientId, showSelection }) => {
    const { getSpreadsheet, updateSpreadsheet, getClientCategory, clientObject } = useClient();
    const spreadsheetRef = useRef(null);

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryLoader, setCategoryLoader] = useState(false);
    const currentYearStart = moment().startOf('year');
    const currentYearEnd = moment().endOf('year');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [categortList, setCategoryList] = useState([])
    const [categoryData, setCategoryData] = useState({});
    const [categoryHeaders, setCategoryHeaders] = useState({});
    const [sheetData, setSheetData] = useState([])
    const [showMenu, setShowMenu] = useState(false)

    useEffect(() => {
        const storedFromDate = localStorage.getItem(`fromDate_${clientObject?.value}`);
        const storedToDate = localStorage.getItem(`toDate_${clientObject?.value}`);

        if (storedFromDate) {
            setFromDate(storedFromDate);
        } else {
            setFromDate(currentYearStart.format('MM/DD/YYYY'))
        }

        if (storedToDate) {
            setToDate(storedToDate);
        } else {
            setToDate(currentYearEnd.format('MM/DD/YYYY'));
        }
    }, [clientObject?.value]);

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
        setIsLoading(true);
        try {
            const csvDetail = await getSpreadsheet(clientId, moment(fromDate, 'MM/DD/YYYY').format('YYYY-MM-DD'), moment(toDate, 'MM/DD/YYYY').format('YYYY-MM-DD'));
            const csv = csvDetail || [];
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
                for (let i = 0; i < headers.length; i++) {
                    if (headers[i]) {
                        if (c.cells[i]?.value) {
                            data[headers[i]] = c.cells[i].value;
                        } else {
                            data[headers[i]] = ""
                        }
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
        if (clientId && fromDate && toDate) {
            fetchCsvLoaded();
        }
    }, [clientId, fromDate, toDate]);

    useEffect(() => {
        if (clientId) {
            fetchClientCategory()
        }
    }, [clientId]);

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

    const renderDropdownsForColumns = (row, columnLetters, values) => {
        columnLetters.forEach((columnLetter, index) => {
            const value = values[index] || "";
            handleCellRender({
                element: document.querySelector(`td[aria-label='${value}${columnLetter}${row}']`),
                colIndex: columnLetter.charCodeAt(0) - 65,
                rowIndex: row - 1,
                cell: { value },
                address: `${columnLetter}${row}`
            });
        });
    }

    const handleActionComplete = async (args) => {
        if (args.action === 'format' || args.action === 'cellSave' || args.action === 'clipboard' ||
            args.action === 'cellDelete' || args.action === 'delete' || args.action === 'insert' || args.action === 'autofill') {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const editedData = []

            if (args.action === 'autofill') {
                const cellAddress = args.eventArgs.fillRange
                const cellAddressWithoutSheet = cellAddress.split('!')[1];
                const rowNumberMatch = cellAddressWithoutSheet.match(/\d+/);
                const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
                const editedRow = convertCellsToValues(sheet.rows[rowIndex - 1])
                while (editedRow.length <= 13) {
                    editedRow.push("");
                }

                if (!editedRow[6]) {
                    editedRow[6] = 100;
                }
                editedData.push(editedRow)
                const fValue = editedRow[5] ? `${editedRow[5]} ` : "";
                const iValue = editedRow[8] ? `${editedRow[8]} ` : "";
                const nValue = editedRow[13] ? `${editedRow[13]} ` : "";

                renderDropdownsForColumns(rowIndex, ['F', 'I', 'N'], [fValue, iValue, nValue]);

            } else if (args?.eventArgs?.address) {
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
                    while (editedRow.length <= 13) {
                        editedRow.push("");
                    }

                    if (!editedRow[6]) {
                        editedRow[6] = 100;
                    }
                    editedData.push(editedRow)
                    const fValue = editedRow[5] ? `${editedRow[5]} ` : "";
                    const iValue = editedRow[8] ? `${editedRow[8]} ` : "";
                    const nValue = editedRow[13] ? `${editedRow[13]} ` : "";

                    renderDropdownsForColumns(rowIndex, ['F', 'I', 'N'], [fValue, iValue, nValue]);
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
                    while (currentRowData.length <= 13) {
                        currentRowData.push("");
                    }

                    if (!currentRowData[6]) {
                        currentRowData[6] = 100;
                    }
                    const fValue = currentRowData[5] ? `${currentRowData[5]} ` : "";
                    const iValue = currentRowData[8] ? `${currentRowData[8]} ` : "";
                    const nValue = currentRowData[13] ? `${currentRowData[13]} ` : "";

                    editedData.push(currentRowData);
                    renderDropdownsForColumns(row, ['F', 'I', 'N'], [fValue, iValue, nValue]);
                }
            }
            if (editedData?.length > 0) {
                const data = await updateSpreadsheet(clientId, editedData);
                applyCalculations()

                if (data?.insertedDataId.length > 0) {
                    if (args.action === 'autofill') {
                        const cellAddress = args.eventArgs.fillRange
                        const cellAddressWithoutSheet = cellAddress.split('!')[1];
                        const rowNumberMatch = cellAddressWithoutSheet.match(/\d+/);
                        const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;

                        spreadsheetRef.current.updateCell({ value: 100 }, `G${rowIndex}`);
                        spreadsheetRef.current.updateCell({ value: data.insertedDataId[0] }, `A${rowIndex}`);
                    } else if (args?.eventArgs?.address && args.action !== 'cellDelete') {
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
                                spreadsheetRef.current.updateCell({ value: 100 }, `G${rowIndex}`);
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
        try {
            if (spreadsheetRef.current) {
                const sheet = spreadsheetRef.current.getActiveSheet();
                const rowCount = sheet.usedRange.rowIndex + 1;

                for (let row = 2; row <= rowCount; row++) {
                    const formula = `=IF(AND(ISNUMBER(D${row}), ISNUMBER(G${row})), ROUND((D${row}*G${row})/100, 2), "")`;
                    spreadsheetRef.current.updateCell({ formula }, `H${row}`);

                    const gstFormula = `=IF(AND(ISNUMBER(H${row}), I${row}<>""), ROUND(H${row}/11, 2), "")`;
                    spreadsheetRef.current.updateCell({ formula: gstFormula }, `J${row}`);

                    const excGstFormula = `=IF(AND(ISNUMBER(H${row}), ISNUMBER(J${row})), ROUND(H${row}-J${row}, 2), "")`;
                    spreadsheetRef.current.updateCell({ formula: excGstFormula }, `K${row}`);

                    const baslabnFormula = `=IF(ISNUMBER(J${row}), IF(J${row} > 0, "1A", "1B"), "")`;
                    spreadsheetRef.current.updateCell({ formula: baslabnFormula }, `O${row}`);

                }
            }
        } catch (error) {
            console.log("error--", error);
        }
    };


    const formateSheet = () => {
        try {
            if (spreadsheetRef.current) {
                const sheet = spreadsheetRef.current.getActiveSheet();

                if (sheet) {
                    const colCount = sheet.usedRange.colIndex + 1;
                    const rowCount = sheet.usedRange.rowIndex + 1;

                    const firstRowRange = `B1:${String.fromCharCode(64 + colCount)}1`;
                    spreadsheetRef.current.cellFormat({ fontWeight: 'bold', backgroundColor: '#4b5366', color: '#FFFFFF' }, firstRowRange);
                    // spreadsheetRef.current.autoFit(`B:${String.fromCharCode(64 + colCount)}`);

                    // spreadsheetRef.current.lockCells(`A1:A${rowCount}`, true);
                    spreadsheetRef.current.hideColumn(0, 0);

                    sheet.columns[0].allowResizing = false;

                    // const rangeToProtect = `A1:A${rowCount}`;
                    // spreadsheetRef.current.lockCells(rangeToProtect, true);

                    const columnsToFormat = [
                        { range: `D2:D${rowCount}` },
                        { range: `H2:G${rowCount}` },
                        { range: `J2:I${rowCount}` },
                        { range: `K2:J${rowCount}` }
                    ];

                    columnsToFormat.forEach(({ range, color }) => {
                        spreadsheetRef.current.conditionalFormat({
                            type: 'LessThan',
                            value: '0',
                            format: {
                                style: {
                                    color: '#FF0000',
                                },
                            },
                            range: range,
                        });
                    })
                    setIsLoading(false);
                }
            }
        } catch (error) {
            console.log("error--", error)
        }
    };

    const fetchClientCategory = async () => {
        try {
            const { data } = await getClientCategory(clientId);
            const headers = data.shift();
            headers.splice(0, 1)
            const removeHtmlTags = (text) => {
                return text.replace(/<[^>]*>/g, '');
            };

            const cleanedHeaders = headers.map(removeHtmlTags);
            setCategoryHeaders(cleanedHeaders);

            const newArray = data.map(subArray => {
                if (!subArray[0] || !subArray[2] || !subArray[3]) {
                    return null;
                }

                const cleanedFirstElement = subArray[0]
                    .replace(/<\/?b>/g, '')
                    .replace(/<\/?i>/g, '')
                    .replace(/<\/?u>/g, '');

                return cleanedFirstElement;
            }).filter(Boolean);
            setCategoryList(newArray)

            const categoryMap = Object.fromEntries(
                data.map(subArray => {
                    const cleanedCategory = subArray[0].replace(/<\/?b>/g, '').replace(/<\/?i>/g, '').replace(/<\/?u>/g, '');
                    if (subArray[2] && subArray[3]) {
                        return [cleanedCategory, subArray.slice(1)];
                    }
                    return null;
                })
                    .filter(Boolean)
            );

            setCategoryList(Object.keys(categoryMap));
            setCategoryData(categoryMap);
        } catch (error) {
            console.log("error", error)
        }

    };


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
        try {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const rowNumberMatch = cellAddress.match(/\d+/);
            const rowIndex = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
            const editedRow = convertCellsToValues(sheet.rows[rowIndex - 1])
            if (editedRow && editedRow.length >= 5) {
                editedRow[5] = value;
            }
            await updateSpreadsheet(clientId, [editedRow]);
        } catch (error) {
            console.log("error--", error)
        }
    }

    const handleCellRender = (args) => {
        try {
            if (sheetData.length > 0 && sheetData[0].Id !== '') {
                const columnLetter = numberToAlphabet(args.colIndex + 1);
                const rowNumber = args.rowIndex + 1;
                const sheet = spreadsheetRef.current.getActiveSheet();
                const rowCount = sheet.usedRange.rowIndex + 1;

                if (columnLetter === 'N' && args.rowIndex > 0 && args.rowIndex < rowCount) {
                    itrDropdown(args, columnLetter, rowNumber)
                }


                if (columnLetter === 'I' && args.rowIndex > 0 && args.rowIndex < rowCount) {
                    gstDropdown(args, columnLetter, rowNumber)
                }

                if (columnLetter === 'F' && args.rowIndex > 0 && args.rowIndex < rowCount) {
                    const selectElement = document.createElement('select');
                    selectElement.style.width = '100%';
                    selectElement.style.height = '100%';

                    categortList.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item;
                        option.textContent = item;
                        selectElement.appendChild(option);
                    });

                    selectElement.value = (args.cell?.value || '').trim();

                    selectElement.onchange = async (event) => {
                        setCategoryLoader(true);
                        setTimeout(async () => {
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
                                            const itrDropdownElement = args.element.closest('tr').querySelector(`td[aria-colindex="${14}"] select`);
                                            const gstDropdownElement = args.element.closest('tr').querySelector(`td[aria-colindex="${9}"] select`);
                                            if (itrDropdownElement && categoryHeaderIndex === 2) {
                                                itrDropdownElement.value = headerValue;
                                            } else if (gstDropdownElement && categoryHeaderIndex === 1) {
                                                gstDropdownElement.value = headerValue;
                                            }
                                            applyCalculations();
                                        } catch (error) {
                                            console.error(`Error updating cell ${address}:`, error);
                                        }
                                    }
                                });
                            }
                            setCategoryLoader(false);
                            handleDropdown(cellAddress, selectedValue);
                            formateSheet();
                        }, 0);
                    };

                    args.element.innerHTML = '';
                    args.element.appendChild(selectElement);
                }
            }

        } catch (error) {
            console.log("error--", error)
        }
    };

    const itrDropdown = (args, columnLetter, rowNumber) => {
        const selectElement = document.createElement('select');
        selectElement.style.width = '100%';
        selectElement.style.height = '100%';

        itrList.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });

        selectElement.value = (args.cell?.value || '').trim();

        selectElement.onchange = async (event) => {
            const selectedValue = event.target.value;
            const cellAddress = `${columnLetter}${rowNumber}`;

            spreadsheetRef.current.updateCell({ value: selectedValue }, cellAddress);
            handleDropdown(cellAddress, selectedValue);
        };

        args.element.innerHTML = '';
        args.element.appendChild(selectElement);
    }

    const gstDropdown = (args, columnLetter, rowNumber) => {
        const selectElement = document.createElement('select');
        selectElement.style.width = '100%';
        selectElement.style.height = '100%';

        const gstList = ['BAS Excluded', 'GST Free Expenses', 'GST Free Income', 'GST on Expenses', 'GST on Income']

        gstList.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            selectElement.appendChild(option);
        });

        selectElement.value = (args.cell?.value || '').trim();

        selectElement.onchange = async (event) => {
            const selectedValue = event.target.value;
            const cellAddress = `${columnLetter}${rowNumber}`;

            spreadsheetRef.current.updateCell({ value: selectedValue }, cellAddress);
            handleDropdown(cellAddress, selectedValue);
        };

        args.element.innerHTML = '';
        args.element.appendChild(selectElement);
    }

    useEffect(() => {
        $('#datepicker').datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy',
            changeMonth: true,
            changeYear: true,
            yearRange: "1900:2100",
        }).on('change', function () {
            const selectedDate = $(this).val();
            setFromDate(selectedDate);
            localStorage.setItem(`fromDate_${clientObject?.value}`, selectedDate);
        });

        $('#datepicker1').datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy',
            changeMonth: true,
            changeYear: true,
            yearRange: "1900:2100",
        }).on('change', function () {
            const selectedDate = $(this).val();
            setToDate(selectedDate);
            localStorage.setItem(`toDate_${clientObject?.value}`, selectedDate);
        });
    }, []);


    const calculateDateRange = (option) => {
        let startDate, endDate;

        switch (option) {
            case 'thisMonth':
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
                break;

            case 'lastMonth':
                startDate = moment().subtract(1, 'months').startOf('month');
                endDate = moment().subtract(1, 'months').endOf('month');
                break;

            case 'thisQuarter':
                startDate = moment().startOf('quarter');
                endDate = moment().endOf('quarter');
                break;

            case 'lastQuarter':
                startDate = moment().subtract(1, 'quarters').startOf('quarter');
                endDate = moment().subtract(1, 'quarters').endOf('quarter');
                break;

            case 'thisYear':
                startDate = moment().startOf('year');
                endDate = moment().endOf('year');
                break;

            case 'lastYear':
                startDate = moment().subtract(1, 'years').startOf('year');
                endDate = moment().subtract(1, 'years').endOf('year');
                break;

            case 'currentMonthToDate':
                startDate = moment().startOf('month');
                endDate = moment();
                break;

            case 'currentQuarterToDate':
                startDate = moment().startOf('quarter');
                endDate = moment();
                break;

            case 'currentYearToDate':
                startDate = moment().startOf('year');
                endDate = moment();
                break;

            default:
                startDate = null;
                endDate = null;
                break;
        }

        startDate = startDate ? startDate.format('MM/DD/YYYY') : ''
        endDate = endDate ? endDate.format('MM/DD/YYYY') : ''
        setFromDate(startDate)
        localStorage.setItem(`fromDate_${clientObject?.value}`, startDate);
        setToDate(endDate)
        localStorage.setItem(`toDate_${clientObject?.value}`, endDate);
        setShowMenu(false)
    };

    const showDateRange = (option) => {
        let startDate, endDate, rangeText;

        switch (option) {
            case 'thisMonth':
                startDate = moment().startOf('month');
                endDate = moment().endOf('month');
                rangeText = `${startDate.format('MMM YYYY')}`;
                break;

            case 'lastMonth':
                startDate = moment().subtract(1, 'months').startOf('month');
                endDate = moment().subtract(1, 'months').endOf('month');
                rangeText = `${startDate.format('MMM YYYY')}`;
                break;

            case 'thisQuarter':
                startDate = moment().startOf('quarter');
                endDate = moment().endOf('quarter');
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'lastQuarter':
                startDate = moment().subtract(1, 'quarters').startOf('quarter');
                endDate = moment().subtract(1, 'quarters').endOf('quarter');
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'thisYear':
                startDate = moment().startOf('year');
                endDate = moment().endOf('year');
                rangeText = `1 Jan - 31 Dec ${endDate.format('YYYY')}`;
                break;

            case 'lastYear':
                startDate = moment().subtract(1, 'years').startOf('year');
                endDate = moment().subtract(1, 'years').endOf('year');
                rangeText = `1 Jan - 31 Dec ${startDate.format('YYYY')}`;
                break;

            case 'currentMonthToDate':
                startDate = moment().startOf('month');
                endDate = moment();
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'currentQuarterToDate':
                startDate = moment().startOf('quarter');
                endDate = moment();
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            case 'currentYearToDate':
                startDate = moment().startOf('year');
                endDate = moment();
                rangeText = `${startDate.format('D MMM')} - ${endDate.format('D MMM YYYY')}`;
                break;

            default:
                startDate = null;
                endDate = null;
                rangeText = '';
                break;
        }

        return rangeText
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

    return (
        <>
            <div className="special_flex d-flex justify-content-space-between">
                <h1 className="main_title client_name mb-0">{clientObject?.label}</h1>
                {showSelection && (
                    <ClientSelection className="head_select align-self-end" />
                )}
            </div>
            <div className="input_form_box date_container">
                <div className="row">
                    <div className="col-md-12"><label htmlFor="datepicker" className="mb-2">Date Range</label></div>
                    <div className="col-md-4">
                        <div className="form-floating">
                            <input
                                type="text"
                                value={fromDate}
                                className="form-control date_icn py-0"
                                id="datepicker"
                                placeholder="From"
                                readOnly
                            />
                            <label htmlFor="datepicker" className="floating-label">
                                From
                            </label>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="form-floating">
                            <input
                                type="text"
                                value={toDate}
                                className="form-control date_icn py-0"
                                id="datepicker1"
                                placeholder="To"
                                readOnly
                            />
                            <label htmlFor="datepicker1" className="floating-label">
                                To
                            </label>
                        </div>
                    </div>
                    <div className="col-md-1 pos_rel">
                        <div className="box_brd_down" onClick={() => setShowMenu(!showMenu)}></div>
                        <div className={`open_box_down_icon  ${showMenu ? 'd-block' : 'd-none'}`}>
                            <div className="date_main_box">
                                <div onClick={() => calculateDateRange('thisMonth')}>
                                    <div className="dateleft_data">This Month</div>
                                    <div className="dateright_data">{showDateRange('thisMonth')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('thisQuarter')}>
                                    <div className="dateleft_data">This Quarter</div>
                                    <div className="dateright_data">{showDateRange('thisQuarter')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('thisYear')}>
                                    <div className="dateleft_data">This Financial Year</div>
                                    <div className="dateright_data">{showDateRange('thisYear')}</div>
                                </div>
                            </div>
                            <div className="date_main_box">
                                <div onClick={() => calculateDateRange('lastMonth')}>
                                    <div className="dateleft_data">Last Month</div>
                                    <div className="dateright_data">{showDateRange('lastMonth')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('lastQuarter')}>
                                    <div className="dateleft_data">Last Quarter</div>
                                    <div className="dateright_data">{showDateRange('lastQuarter')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('lastYear')}>
                                    <div className="dateleft_data">Last Financial Year</div>
                                    <div className="dateright_data">{showDateRange('lastYear')}</div>
                                </div>
                            </div>
                            <div className="date_main_box">
                                <div onClick={() => calculateDateRange('currentMonthToDate')}>
                                    <div className="dateleft_data">Month To Date</div>
                                    <div className="dateright_data">{showDateRange('currentMonthToDate')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('currentQuarterToDate')}>
                                    <div className="dateleft_data">Quarter To Date</div>
                                    <div className="dateright_data">{showDateRange('currentQuarterToDate')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('currentYearToDate')}>
                                    <div className="dateleft_data">Year To Date</div>
                                    <div className="dateright_data">{showDateRange('currentYearToDate')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <>
                {isLoading ? (
                    <Loader />) : (
                    <>
                        {dataLoaded && (<Loader />)}
                        {categoryLoader && <LoaderOverlay />}
                        <div className={`account_sheet spreadsheet ${dataLoaded && 'invisible'} spreadsheet_height`}>
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
                                    // const sheet = spreadsheetRef.current.getActiveSheet()
                                    // const colCount = sheet.usedRange.colIndex + 1;
                                    // spreadsheetRef.current.autoFit(`B:${String.fromCharCode(64 + colCount)}`);
                                    spreadsheetRef.current.selectRange('B1');
                                    applyCalculations();
                                    formateSheet();
                                    setDataLoaded(false)
                                    setTimeout(() => {
                                        spreadsheetRef.current.setRangeReadOnly(true, 'A1:Z1');
                                    }, 1000);
                                }}
                            >
                                <SheetsDirective>
                                    <SheetDirective frozenRows={1}>
                                        <RangesDirective>
                                            <RangeDirective dataSource={sheetData}></RangeDirective>
                                        </RangesDirective>
                                        <ColumnsDirective>
                                            <ColumnDirective width={0} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={130} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={650} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={200} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={170} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={80} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={200} allowResizing={false}></ColumnDirective>
                                            <ColumnDirective width={100} allowResizing={false}></ColumnDirective>
                                        </ColumnsDirective>
                                    </SheetDirective>
                                </SheetsDirective>
                            </SpreadsheetComponent>
                        </div>
                    </>
                )}
            </>
        </>
    );
};

export default SheetComponent;
