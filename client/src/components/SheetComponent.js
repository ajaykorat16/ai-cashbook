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
import { groupData } from './data';
import { useAuth } from '../contexts/AuthContext';
import { InputSwitch } from 'primereact/inputswitch';

const SheetComponent = ({ clientId, showSelection, disableSelection }) => {
    const { getSpreadsheet, updateSpreadsheet, getClientCategory, clientObject, showInterBank,
        showDateRange, calculateDateRange, setShowInterBank, changeSheetName, shareSheet } = useClient();
    const { toast } = useAuth()
    const spreadsheetRef = useRef(null);

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const currentYearStart = moment().startOf('year');
    const currentYearEnd = moment().endOf('year');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [categortList, setCategoryList] = useState([])
    const [categoryData, setCategoryData] = useState({});
    const [sheetData, setSheetData] = useState([])
    const [showMenu, setShowMenu] = useState(false)
    const [interBankData, setInterBankData] = useState([])
    const [readStatus, setReadStatus] = useState(false)
    const [numOfRows, setNumOfRows] = useState(0)
    const [sheetName, setSheetName] = useState("")
    const [isShared, setIsShared] = useState(false)
    const [link, setLink] = useState("")
    const [buttonText, setButtonText] = useState("Copy Link");

    useEffect(() => {
        const storedFromDate = localStorage.getItem(`fromDate_${clientId}`) ?? currentYearStart.format('MM/DD/YYYY');
        const storedToDate = localStorage.getItem(`toDate_${clientId}`) ?? currentYearEnd.format('MM/DD/YYYY');

        setFromDate(storedFromDate);
        setToDate(storedToDate);
    }, [clientId]);

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
        try {
            const csvDetail = await getSpreadsheet(clientId, moment(fromDate, 'MM/DD/YYYY').format('YYYY-MM-DD'), moment(toDate, 'MM/DD/YYYY').format('YYYY-MM-DD'));
            const interBankIndex = []
            setLink(csvDetail?.link)
            setIsShared(csvDetail?.isShared)
            csvDetail.spreadsheet.forEach((csv) => {
                if (csv[csv.length - 1] === true) {
                    interBankIndex.push(csv[0]);
                }
            });

            const sheet = csvDetail.sheet_name ? csvDetail.sheet_name : 'Spreadsheet'
            setSheetName(sheet)

            setInterBankData(interBankIndex)
            const csv = csvDetail.spreadsheet || [];
            const firstRow = csv[0]
            const headers = ["Id", "Bank_Account", "Date", "Amt", "Narrative", "Categories", 'Business', 'TaxableAmt', 'GST_Code', 'GST_Amt', 'Excl_GST_Amt', 'FY', 'QTR', 'ITR_Label', 'BAS_LabN']

            if (firstRow.length > headers.length) {
                headers.push(...firstRow.slice(headers.length));
            }

            const convertedData = convertToCellFormat(csv);
            convertedData.shift();
            setNumOfRows(convertedData.length + 1000)
            let backendData = []

            if (convertedData.length === 0) {
                backendData = [
                    {
                        cells: Array.from({ length: 15 }, () => ({
                            value: "",
                            style: {}
                        }))
                    }
                ];
            } else {
                backendData = convertedData
            }

            const formattedData = backendData.map((c, index) => {
                const data = {};

                for (let i = 0; i < headers.length; i++) {
                    data[headers[i]] = headers[i] && c.cells[i]?.value ? c.cells[i].value : "";
                }

                const row = index + 2;

                data.TaxableAmt = `=IF(AND(ISNUMBER(D${row}), ISNUMBER(G${row})), ROUND((D${row}*G${row})/100, 2), "")`;
                data.Excl_GST_Amt = `=IF(AND(ISNUMBER(H${row}), ISNUMBER(J${row})), ROUND(H${row}-J${row}, 2), "")`;
                data.GST_Amt = `=IF(AND(ISNUMBER(H${row}), I${row}<>""), ROUND(H${row}/11, 2), "")`;
                data.BAS_LabN = `=IF(ISNUMBER(J${row}), IF(J${row} > 0, "1A", "1B"), "")`;

                return data;
            });

            const additionalDataCount = 1000;
            const newData = Array.from({ length: additionalDataCount }, (_, i) => {
                const row = backendData.length + i + 2;

                return {
                    Id: "",
                    Bank_Account: "",
                    Date: "",
                    Amt: "",
                    Narrative: "",
                    Categories: "",
                    Business: "",
                    TaxableAmt: `=IF(AND(ISNUMBER(D${row}), ISNUMBER(G${row})), ROUND((D${row}*G${row})/100, 2), "")`,
                    GST_Code: "",
                    GST_Amt: `=IF(AND(ISNUMBER(H${row}), I${row}<>""), ROUND(H${row}/11, 2), "")`,
                    Excl_GST_Amt: `=IF(AND(ISNUMBER(H${row}), ISNUMBER(J${row})), ROUND(H${row}-J${row}, 2), "")`,
                    FY: "",
                    QTR: "",
                    ITR_Label: "",
                    BAS_LabN: `=IF(ISNUMBER(J${row}), IF(J${row} > 0, "1A", "1B"), "")`
                };
            });

            setSheetData([...formattedData, ...newData]);
            setDataLoaded(true)
        } catch (error) {
            console.error("Failed to load CSV data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchClientCategory()

            if (fromDate && toDate) {
                fetchCsvLoaded();
            }
        }
    }, [clientId, fromDate, toDate]);

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

    const updateInterBankData = (response, currentData) => {
        const removedIds = [];

        response.forEach(([id1, id2, status]) => {
            if (status === false) {
                if (currentData.includes(id1)) removedIds.push(id1);
                if (currentData.includes(id2)) removedIds.push(id2);

                currentData = currentData.filter(id => id !== id1 && id !== id2);
            } else if (status === true) {
                if (!currentData.includes(id1)) currentData.push(id1);
                if (!currentData.includes(id2)) currentData.push(id2);
            }
        });
        return { updatedData: currentData, removedIds };
    };

    const handleActionComplete = async (args) => {
        if (args.action === 'renameSheet') {
            const name = args?.eventArgs?.value
            if (name) {
                setSheetName(name)
                await changeSheetName(clientId, name)
            }
        }

        if (args.action === 'format' || args.action === 'cellSave' || args.action === 'clipboard' ||
            args.action === 'cellDelete' || args.action === 'delete' || args.action === 'insert' || args.action === 'autofill') {
            handleDropdown()
            const sheet = spreadsheetRef.current.getActiveSheet();
            const editedData = []

            if (args?.eventArgs?.selectedRange) {
                const cellAddress = args.eventArgs.selectedRange
                const { firstRowNumber, lastRowNumber } = getSelectedRowsRange(cellAddress);

                for (let row = firstRowNumber; row <= lastRowNumber; row++) {
                    const currentRowData = convertCellsToValues(sheet.rows[row - 1]);

                    if (!currentRowData[6]) {
                        spreadsheetRef.current.updateCell({ value: 100 }, `G${row}`);
                    }

                    calculationOnRow(row, currentRowData)
                }

                for (let row = firstRowNumber; row <= lastRowNumber; row++) {
                    const currentRowData = convertCellsToValues(sheet.rows[row - 1]);

                    while (currentRowData.length <= 14) {
                        currentRowData.push("");
                    }

                    editedData.push(currentRowData)
                }
            } else if (args.eventArgs.address) {
                const cellAddress = args.eventArgs.address;

                if (args.action === 'cellDelete') {
                    const { firstRowNumber, lastRowNumber } = getSelectedRowsRange(cellAddress.split('!')[1]);

                    for (let row = firstRowNumber; row <= lastRowNumber; row++) {
                        const currentRowData = convertCellsToValues(sheet.rows[row - 1]);
                        editedData.push(currentRowData);
                    }
                } else {
                    const { firstRowNumber, lastRowNumber } = getSelectedRowsRange(cellAddress.split('!')[1], true);
                    for (let row = firstRowNumber; row <= lastRowNumber; row++) {
                        const currentRowData = convertCellsToValues(sheet.rows[row - 1]);

                        if (!currentRowData[6]) {
                            spreadsheetRef.current.updateCell({ value: 100 }, `G${row}`);
                        }

                        calculationOnRow(row, currentRowData)
                    }

                    for (let row = firstRowNumber; row <= lastRowNumber; row++) {
                        const currentRowData = convertCellsToValues(sheet.rows[row - 1]);

                        while (currentRowData.length <= 14) {
                            currentRowData.push("");
                        }
                        editedData.push(currentRowData)
                    }
                }
            } else if (args.action === 'delete') {
                const deletedModels = args.eventArgs.deletedModel ?? [];
                deletedModels.forEach(deletedModel => {
                    const currentRowData = convertCellsToValues(deletedModel);
                    editedData.push([currentRowData[0]]);
                });

            }

            if (editedData?.length > 0) {
                const data = await updateSpreadsheet(clientId, editedData);

                if (data?.insertedDataId.length > 0) {
                    if (args.action === 'autofill') {
                        const cellAddress = args.eventArgs.selectedRange
                        const { firstRowNumber, lastRowNumber } = getSelectedRowsRange(cellAddress);

                        for (let row = firstRowNumber; row <= lastRowNumber; row++) {
                            spreadsheetRef.current.updateCell({ value: data.insertedDataId[0] }, `A${row}`);
                        }
                    } else if (args?.eventArgs?.address && args.action === 'cellSave') {
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

                if (data?.interBankIds.length > 0) {
                    const { updatedData, removedIds } = updateInterBankData(data?.interBankIds, interBankData);
                    setInterBankData(updatedData);
                    setTimeout(() => {
                        highlightMatchingRows(removedIds)
                    }, 2000);
                }
            }
            formateSheet();
        }
    };

    const highlightMatchingRows = (removedIds = []) => {
        try {
            if (spreadsheetRef.current) {
                const spreadsheet = spreadsheetRef.current;
                const sheet = spreadsheet.getActiveSheet();
                const rowCount = sheet.usedRange.rowIndex + 1;

                for (let row = 1; row < rowCount; row++) {
                    const hiddenColumnValue = spreadsheetRef.current.getRowData(row);
                    const { Id } = hiddenColumnValue[0]
                    const firstColValue = Id
                    const firstRowRange = `B${row + 1}:O${row + 1}`;

                    if (removedIds.includes(firstColValue)) {
                        spreadsheetRef.current.cellFormat({ backgroundColor: 'white' }, firstRowRange);
                    } else if (interBankData.includes(firstColValue)) {
                        spreadsheetRef.current.cellFormat({ backgroundColor: showInterBank ? 'yellow' : 'white' }, firstRowRange);
                    }
                }
            }
        } catch (error) {
            console.error('Error while highlighting rows:', error);
        }
    };

    useEffect(() => {
        if (!isLoading) {
            if (interBankData.length === 0 && showInterBank) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Spreadsheet',
                    detail: "Inter bank is not available.",
                    life: 3000
                });
                setShowInterBank(false)
            } else {
                highlightMatchingRows();
            }
        }
    }, [showInterBank, isLoading]);


    const getSelectedRowsRange = (range, isSingleAddress) => {
        if (!isSingleAddress) {
            const [firtstAddress, lastAddress] = range.split(':');
            const firstRowNumber = parseInt(firtstAddress.match(/\d+/)[0], 10);
            const lastRowNumber = parseInt(lastAddress.match(/\d+/)[0], 10);
            return { firstRowNumber, lastRowNumber };
        } else {
            const rowNumberMatch = range.match(/\d+/);
            const firstRowNumber = rowNumberMatch ? parseInt(rowNumberMatch[0], 10) : null;
            return { firstRowNumber, lastRowNumber: firstRowNumber };
        }
    }

    const applyCalculations = () => {
        try {
            if (spreadsheetRef.current) {
                const sheet = spreadsheetRef.current.getActiveSheet();
                const rowCount = sheet.usedRange.rowIndex + 1;
                const totalCount = rowCount + 1000

                for (let row = 2; row <= totalCount; row++) {
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

    const calculationOnRow = (row, currentRowData) => {
        try {
            if (spreadsheetRef.current && row !== 1) {
                // const formula = `=IF(AND(ISNUMBER(D${row}), ISNUMBER(G${row})), ROUND((D${row}*G${row})/100, 2), "")`;
                // spreadsheetRef.current.updateCell({ formula }, `H${row}`);

                // const gstFormula = `=IF(AND(ISNUMBER(H${row}), I${row}<>""), ROUND(H${row}/11, 2), "")`;
                // spreadsheetRef.current.updateCell({ formula: gstFormula }, `J${row}`);

                // const excGstFormula = `=IF(AND(ISNUMBER(H${row}), ISNUMBER(J${row})), ROUND(H${row}-J${row}, 2), "")`;
                // spreadsheetRef.current.updateCell({ formula: excGstFormula }, `K${row}`);

                // const baslabnFormula = `=IF(ISNUMBER(J${row}), IF(J${row} > 0, "1A", "1B"), "")`;
                // spreadsheetRef.current.updateCell({ formula: baslabnFormula }, `O${row}`);

                if (currentRowData[5]) {
                    applyItrAndGst(currentRowData, row);
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
                    spreadsheetRef.current.hideColumn(0, 0);
                    sheet.columns[0].allowResizing = false;

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
            const categories = data.map((d) => {
                return {
                    category: d[0]
                }
            })

            setCategoryList(categories)
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

            setCategoryData(categoryMap);
        } catch (error) {
            console.log("error", error)
        }
    };

    const applyItrAndGst = (currentRowData, rowIndex) => {
        const correspondingData = categoryData[currentRowData[5]];

        if (!currentRowData[8]) {
            spreadsheetRef.current.updateCell({ value: correspondingData[1] }, `I${rowIndex}`);
        }

        if (!currentRowData[13]) {
            spreadsheetRef.current.updateCell({ value: correspondingData[2] }, `N${rowIndex}`);
        }
    };

    useEffect(() => {
        initiateDatePicker('#datepicker', 'fromDate');
        initiateDatePicker('#datepicker1', 'toDate');

        const handleResize = () => {
            spreadsheetRef.current.refresh();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };

    }, []);

    const initiateDatePicker = (selector, id) => {
        $(selector).datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy',
            changeMonth: true,
            changeYear: true,
            yearRange: "1900:2100",
        }).on('change', function () {
            const selectedDate = $(this).val();
            selector === '#datepicker' ? setFromDate(selectedDate) : setToDate(selectedDate);
            localStorage.setItem(`${id}_${clientObject?.value}`, selectedDate);
        });
    }

    const setDateRange = (option) => {
        const { startDate, endDate } = calculateDateRange(option)
        setFromDate(startDate)
        setToDate(endDate)
        setShowMenu(false)
    }

    // useEffect(() => {
    //     const handleResize = () => {
    //         spreadsheetRef.current.refresh();
    //     };

    //     window.addEventListener('resize', handleResize);

    //     return () => {
    //         window.removeEventListener('resize', handleResize);
    //     };
    // }, []);

    const handleDropdown = () => {
        if (spreadsheetRef?.current?.isRendered === false) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            const rowCount = sheet.usedRange.rowIndex + 1;

            spreadsheetRef.current.addDataValidation(
                {
                    type: 'List',
                    inCellDropDown: true,
                    value1: `=Categories!A3:A${categortList.length}`,
                },
                `F2:F${rowCount}`
            );

            spreadsheetRef.current.addDataValidation(
                {
                    type: 'List',
                    inCellDropDown: true,
                    value1: '=ItrLabels!A2:A25',
                    ignoreBlank: false,
                },
                `N2:N${rowCount}`
            );

            spreadsheetRef.current.addDataValidation(
                {
                    type: 'List',
                    inCellDropDown: true,
                    value1: '=ItrLabels!B2:B6',
                    ignoreBlank: false,
                },
                `I2:I${rowCount}`
            );
        }
    }

    useEffect(() => {
        if (readStatus) {
            spreadsheetRef.current.setRangeReadOnly(true, 'A1:O1');
            setReadStatus(false)
        }
    }, [readStatus])

    const handleShare = async (e) => {
        const value = e.value
        setIsShared(value)
        const link = await shareSheet(clientId, value)
        setLink(link)
    }

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(link);

            setButtonText("Copied!");

            setTimeout(() => {
                setButtonText("Copy Link");
            }, 2000);
        } catch (err) {
            console.error("Failed to copy the link: ", err);
        }
    };

    return (
        <>
            <div className="special_flex d-flex justify-content-space-between">
                <h1 className="main_title client_name mb-0">{sheetName}</h1>
                <div className='d-flex align-items-center switch_container'>
                    {!disableSelection && (
                        <div className='d-flex align-items-center'>
                            {link && (
                                <button className="common_btn copy_link_btn ms-4" onClick={() => handleCopyLink()}>
                                    {buttonText}
                                </button>
                            )}
                            <div className="d-flex align-items-center share_switch">
                                <InputSwitch checked={isShared} onChange={(e) => handleShare(e)} />
                                <label className="form-check-label share_switch_label" htmlFor="flexSwitchCheckChecked">Share</label>
                            </div>
                        </div>
                    )}
                    {showSelection && (
                        <ClientSelection className="head_select" disabled={disableSelection} />
                    )}
                </div>
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
                                <div onClick={() => setDateRange('thisMonth')}>
                                    <div className="dateleft_data">This Month</div>
                                    <div className="dateright_data">{showDateRange('thisMonth')}</div>
                                </div>
                                <div onClick={() => setDateRange('thisQuarter')}>
                                    <div className="dateleft_data">This Quarter</div>
                                    <div className="dateright_data">{showDateRange('thisQuarter')}</div>
                                </div>
                                <div onClick={() => setDateRange('thisYear')}>
                                    <div className="dateleft_data">This Financial Year</div>
                                    <div className="dateright_data">{showDateRange('thisYear')}</div>
                                </div>
                            </div>
                            <div className="date_main_box">
                                <div onClick={() => setDateRange('lastMonth')}>
                                    <div className="dateleft_data">Last Month</div>
                                    <div className="dateright_data">{showDateRange('lastMonth')}</div>
                                </div>
                                <div onClick={() => setDateRange('lastQuarter')}>
                                    <div className="dateleft_data">Last Quarter</div>
                                    <div className="dateright_data">{showDateRange('lastQuarter')}</div>
                                </div>
                                <div onClick={() => setDateRange('lastYear')}>
                                    <div className="dateleft_data">Last Financial Year</div>
                                    <div className="dateright_data">{showDateRange('lastYear')}</div>
                                </div>
                            </div>
                            <div className="date_main_box">
                                <div onClick={() => setDateRange('currentMonthToDate')}>
                                    <div className="dateleft_data">Month To Date</div>
                                    <div className="dateright_data">{showDateRange('currentMonthToDate')}</div>
                                </div>
                                <div onClick={() => setDateRange('currentQuarterToDate')}>
                                    <div className="dateleft_data">Quarter To Date</div>
                                    <div className="dateright_data">{showDateRange('currentQuarterToDate')}</div>
                                </div>
                                <div onClick={() => setDateRange('currentYearToDate')}>
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
                        <div className={`account_sheet spreadsheet ${dataLoaded && 'invisible'} spreadsheet_height`}>
                            <SpreadsheetComponent
                                ref={spreadsheetRef}
                                actionComplete={handleActionComplete}
                                // showSheetTabs={false}
                                allowSorting={true}
                                allowFiltering={true}
                                selectionSettings={{
                                    mode: 'Multiple'
                                }}
                                created={() => {
                                    if (spreadsheetRef?.current?.isRendered === false) {
                                        spreadsheetRef.current.selectRange('B1');
                                        formateSheet();
                                        // applyCalculations()
                                        handleDropdown()
                                        setDataLoaded(false)
                                        setTimeout(() => {
                                            setReadStatus(true)
                                        }, 2000);
                                    }
                                }}
                            >
                                <SheetsDirective>
                                    <SheetDirective frozenRows={1} name={sheetName}>
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
                                    <SheetDirective name="Categories">
                                        <RangesDirective>
                                            <RangeDirective dataSource={categortList}></RangeDirective>
                                        </RangesDirective>
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
            </>
        </>
    );
};

export default SheetComponent;
