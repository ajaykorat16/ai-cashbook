import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout';
import { useClient } from '../contexts/ClientContexts';
import moment from 'moment';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.css';
import 'jquery-ui-dist/jquery-ui';

const ItrReport = () => {
    const { getAllClients, clientObject, setClientObject, getItrReport } = useClient()

    const [showMenu, setShowMenu] = useState(false)
    const [fromDate, setFromDate] = useState()
    const [toDate, setToDate] = useState()
    const [itrReport, setItrRport] = useState([])
    const [totalExcGst, setTotaltotalExcGst] = useState([])


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

    const getReportData = async () => {
        const formattedFromDate = moment(fromDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const formattedToDate = moment(toDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const data = await getItrReport(clientObject?.value, formattedFromDate, formattedToDate)
        setItrRport(data?.excGstResult)
        setTotaltotalExcGst(data?.grandTotalExcGst)
        console.log("data--", data)
    }

    useEffect(() => {
        if (clientObject?.value) {
            getReportData()
        }
    }, [clientObject?.value])

    useEffect(() => {
        if (clientObject?.value && fromDate && toDate) {
            getReportData()
        }
    }, [clientObject?.value, fromDate, toDate])


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
                        <thead>
                            <tr>
                                <th>Itr Label</th>
                                <th>Tax Category</th>
                                <th>Sum of Excl.GST_Amt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itrReport && itrReport.map((itr, index) => (
                                <React.Fragment key={index}>
                                    {itr.ITR_Label && (
                                        <tr>
                                            <td>{itr.ITR_Label}</td>
                                            <td>{itr.Tax_Category}</td>
                                            <td>{itr.Sum_of_Exc_GST_Amt}</td>
                                        </tr>
                                    )}
                                    {!itr.ITR_Label && (
                                        <tr>
                                            <td></td>
                                            <td>{itr.Tax_Category}</td>
                                            <td>{itr.Sum_of_Exc_GST_Amt}</td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {totalExcGst && (
                                <tr>
                                    <td>Total</td>
                                    <td></td>
                                    <td>{totalExcGst}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    )
}

export default ItrReport
