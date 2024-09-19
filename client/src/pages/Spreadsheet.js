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
import { SheetsDirective, SheetDirective, RangesDirective, RangeDirective, SpreadsheetComponent } from '@syncfusion/ej2-react-spreadsheet';
import Loader from '../components/Loader';
import { useClient } from '../contexts/ClientContexts';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';


const Spreadsheet = () => {
    const navigate = useNavigate();
    const params = useParams();
    const { getSpreadsheet, updateSpreadsheet } = useClient();
    const spreadsheetRef = useRef(null);

    const [dataLoaded, setDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

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
            const format = value?.format || '';

            if (format.includes('$')) {
                cellValue = `$${parseFloat(cellValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
            }

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
        setIsLoading(true)
        const csvDetail = await getSpreadsheet(params?.id);
        const csv = csvDetail?.data || []
        const convertedData = convertToCellFormat(csv);

        if (spreadsheetRef?.current) {
            const sheet = spreadsheetRef.current.getActiveSheet();
            sheet.rows = convertedData;
            spreadsheetRef.current.refresh();
        }
        setTimeout(() => {
            setDataLoaded(true);
        }, 3500);
    }

    useEffect(() => {
        if (params?.id) {
            fetchCsvLoaded();
        }
    }, [params?.id]);

    useEffect(() => {
        if (dataLoaded) {
            formateSheet();
            getSheetData();
            applyFilterOnColumn('A');
        }
    }, [dataLoaded]);

    const handleActionComplete = async (args) => {
        if (args.action === 'format' || args.action === 'cellSave' || args.action === 'clipboard' ||
            args.action === 'cellDelete' || args.action === 'delete' || args.action === 'insert') {
            const formattedData = await getSheetData();
            await updateSpreadsheet(params?.id, formattedData);
            formateSheet();
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

            // const range = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
            // spreadsheetRef.current.cellFormat({ border: 'none', borderBottom: '1px solid #FFFFFF' }, range);

            // const outerBorderRange = `A1:${String.fromCharCode(64 + colCount)}${rowCount}`;
            // spreadsheetRef.current.setBorder({ border: '1px solid #e0e0e0' }, outerBorderRange, 'Outer');

            // const horizontalBorderRange = `A2:${String.fromCharCode(64 + colCount)}${rowCount}`;
            // spreadsheetRef.current.setBorder({ border: '1px solid #e0e0e0' }, horizontalBorderRange, 'Horizontal');
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
            spreadsheetRef.current.refresh();
        }
    };

    return (
        <section className="data_sheet">
            <div className="">
                <div className="sheet_flex">
                    <div className="left_part_bg">
                        <div className="input_form_box">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-floating">
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                label="From"
                                                value={fromDate}
                                                onChange={(newValue) => setFromDate(newValue)}
                                            />
                                        </LocalizationProvider>
                                    </div>
                                </div>
                                <div className="col-md-12">
                                    <div className="form-floating">
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                label="To"
                                                value={toDate}
                                                onChange={(newValue) => setToDate(newValue)}
                                            />
                                        </LocalizationProvider>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="common_btn w-100 mb-20">Summary</button>
                        <button className="common_btn w-100 mb-20">Custom 1</button>
                        <button className="common_btn w-100 mb-20">Custom 2</button>
                        <button className="common_btn w-100 mb-20">Apply</button>
                        <button className="common_btn w-100 mb-20" onClick={() => navigate("/user/clients")}>Back to list</button>
                    </div>
                    {params?.id && (
                        <>
                            {isLoading && (
                                <div className='d-flex align-item-center w-100 spreadsheet-loader'>
                                    <Loader />
                                </div>
                            )}
                            <div className={`sheet_data ${isLoading && 'invisible'}`}>
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
                                        </SheetDirective>
                                    </SheetsDirective>
                                </SpreadsheetComponent>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Spreadsheet;
