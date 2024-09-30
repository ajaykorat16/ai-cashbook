import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout';
import { useClient } from '../contexts/ClientContexts';
import moment from 'moment';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.css';
import 'jquery-ui-dist/jquery-ui';

const Report = () => {
    const { getAllClients, clientObject, setClientObject } = useClient()

    const [showMenu, setShowMenu] = useState(false)
    const [fromDate, setFromDate] = useState()
    const [toDate, setToDate] = useState()

    useEffect(() => {
        $('#datepicker').datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy',
        });
        $('#datepicker1').datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy',
        });
    }, []);

    const fetchClient = async () => {
        const { clients } = await getAllClients(1, 1, "_id", -1, "")
        if (clients.length > 0) {
            setClientObject({
                label: clients[0].entity_name ? clients[0].entity_name : `${clients[0].first_name} ${clients[0].last_name}`,
                value: clients[0]._id,
            })
        }
    }

    useEffect(() => {
        if (!clientObject?.value) {
            fetchClient()
        } else {
            setClientObject({
                label: clientObject?.label,
                value: clientObject?.value,
            })
        }
    }, [])

    useEffect(() => {
        $('#datepicker').datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy'
        }).on('change', function () {
            const selectedDate = $(this).val();
            setFromDate(selectedDate);
        });

        $('#datepicker1').datepicker({
            uiLibrary: 'bootstrap5',
            dateFormat: 'mm/dd/yy'
        }).on('change', function () {
            const selectedDate = $(this).val();
            setToDate(selectedDate);
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
        setToDate(endDate)
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

    return (
        <Layout showSelection={true}>
            <div className="special_flex mb-25">
                <h1 className="main_title">Report</h1>
            </div>
            <div className="input_form_box">
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
                                    <div className="dateleft_data">Month to date</div>
                                    <div className="dateright_data">{showDateRange('currentMonthToDate')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('currentQuarterToDate')}>
                                    <div className="dateleft_data">Quarter to date</div>
                                    <div className="dateright_data">{showDateRange('currentQuarterToDate')}</div>
                                </div>
                                <div onClick={() => calculateDateRange('currentYearToDate')}>
                                    <div className="dateleft_data">Year to date</div>
                                    <div className="dateright_data">{showDateRange('currentYearToDate')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="profit_loss">
                <h2>Profit and Loss</h2>
                <h3>Demo Company (AU)</h3>
                <h4>For the year ended 30 June 2025</h4>
                <div className="table-responsive">
                    <table>
                        <tr>
                            <th></th>
                            <th>2025</th>
                            <th>2024</th>
                            <th>2023</th>
                            <th>2022</th>
                            <th>2021</th>
                        </tr>
                        <tr>
                            <td colSpan="6" className="table_bold_txt">Trading Income</td>
                        </tr>
                        <tr>
                            <td>Sales</td>
                            <td>17,447.32</td>
                            <td>35,931.00</td>
                            <td>4,200.00</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td className="table_bold_txt_sub">Total Trading Income</td>
                            <td>17,447.32</td>
                            <td>35,931.00</td>
                            <td>4,200.00</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td colSpan="6" className="table_bold_txt pt-4">Cost of Sales</td>
                        </tr>
                        <tr>
                            <td>Purchases</td>
                            <td>763.64</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td className="table_bold_txt_sub">Total Cost of Sales</td>
                            <td>763.64</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td className="table_bold_txt_sub font-16">Gross Profit</td>
                            <td className="table_bold_txt_sub">16,683.68</td>
                            <td className="table_bold_txt_sub">35,931.00</td>
                            <td className="table_bold_txt_sub">4,200.00</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>


                        <tr>
                            <td colSpan="6" className="table_bold_txt pt-4">Other Income</td>
                        </tr>
                        <tr>
                            <td>Interest Income</td>
                            <td>97.05</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td className="table_bold_txt_sub">Total Other Income</td>
                            <td className="table_bold_txt_sub">97.05</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>



                        <tr>
                            <td colSpan="6" className="table_bold_txt pt-4">Operating Expenses</td>
                        </tr>
                        <tr>
                            <td>Advertising</td>
                            <td>2,272.73</td>
                            <td>1,830.18</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Bank Fees</td>
                            <td>300.00</td>
                            <td>31.50</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Cleaning</td>
                            <td>155.00</td>
                            <td>310.00</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Consulting & Accounting</td>
                            <td>49.00</td>
                            <td>49.00</td>
                            <td>3,600.00</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>Entertainment</td>
                            <td>-</td>
                            <td>277.20</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td className="table_bold_txt_sub">Total Operating Expensest</td>
                            <td className="table_bold_txt_sub">14,754.34</td>
                            <td className="table_bold_txt_sub">46,091.84</td>
                            <td className="table_bold_txt_sub">12,112.00</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td className="table_bold_txt_sub font-16 pt-4">Net Profit</td>
                            <td className="table_bold_txt_sub pt-4">2,026.39</td>
                            <td className="table_bold_txt_sub pt-4">(10,160.84)</td>
                            <td className="table_bold_txt_sub pt-4">(7,912.00)</td>
                            <td>-</td>
                            <td>-</td>
                        </tr>
                    </table>
                </div>
            </div>
        </Layout>
    )
}

export default Report
