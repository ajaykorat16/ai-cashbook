import React, { useEffect, useState } from 'react'
import { useClient } from '../contexts/ClientContexts'
import $ from 'jquery';
import moment from 'moment';
import 'jquery-ui-dist/jquery-ui.css';
import 'jquery-ui-dist/jquery-ui';

const DateRange = ({ fromDate, setFromDate, setToDate, toDate, isSheet = false }) => {
    const { calculateDateRange, showDateRange, clientObject } = useClient()

    const [showMenu, setShowMenu] = useState(false)
    const currentYearStart = moment().startOf('year');
    const currentYearEnd = moment().endOf('year');

    const setDateRange = (option) => {
        const { startDate, endDate } = calculateDateRange(option)
        setFromDate(startDate)
        setToDate(endDate)
        setShowMenu(false)
    }

    useEffect(() => {
        if (!isSheet) {
            const storedFromDate = localStorage.getItem(`fromDate_${clientObject?.value}`) ?? currentYearStart.format('MM/DD/YYYY');
            const storedToDate = localStorage.getItem(`toDate_${clientObject?.value}`) ?? currentYearEnd.format('MM/DD/YYYY');

            setFromDate(storedFromDate);
            setToDate(storedToDate);
        }
    }, [clientObject?.value]);

    useEffect(() => {
        initiateDatePicker('#datepicker');
        initiateDatePicker('#datepicker1');
    }, []);

    useEffect(() => {
        if (fromDate) localStorage.setItem(`fromDate_${clientObject.value}`, fromDate);
        if (toDate) localStorage.setItem(`toDate_${clientObject.value}`, toDate);
    }, [fromDate, toDate]);

    const initiateDatePicker = (selector) => {
        $(selector).datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy',
            changeMonth: true,
            changeYear: true,
            yearRange: "1900:2100",
        }).on('change', function () {
            const selectedDate = $(this).val();
            selector === '#datepicker' ? setFromDate(selectedDate) : setToDate(selectedDate);
        });
    }

    return (
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
    )
}

export default DateRange
