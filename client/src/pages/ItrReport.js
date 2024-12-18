import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout';
import { useClient } from '../contexts/ClientContexts';
import moment from 'moment';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.css';
import 'jquery-ui-dist/jquery-ui';
import ClientSelection from '../components/ClientSelection';

const ItrReport = () => {
    const { getAllClients, clientObject, setClientObject, getItrReport, showDateRange, calculateDateRange } = useClient()

    const [showMenu, setShowMenu] = useState(false)
    const currentYearStart = moment().startOf('year');
    const currentYearEnd = moment().endOf('year');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [itrReport, setItrRport] = useState([])
    const [totalExcGst, setTotaltotalExcGst] = useState([])

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


    const setDateRange = (option) => {
        const { startDate, endDate } = calculateDateRange(option)
        setFromDate(startDate)
        setToDate(endDate)
        setShowMenu(false)
    }

    const getReportData = async () => {
        const formattedFromDate = moment(fromDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const formattedToDate = moment(toDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const data = await getItrReport(clientObject?.value, formattedFromDate, formattedToDate)
        setItrRport(data?.excGstResult)
        setTotaltotalExcGst(data?.grandTotalExcGst)
    }

    useEffect(() => {
        if (clientObject?.value && fromDate && toDate) {
            getReportData()
        }
    }, [clientObject?.value, fromDate, toDate])


    return (
        <Layout>
            <div className="special_flex d-flex justify-content-space-between">
                <h1 className="main_title mb-0">ITR Report</h1>
                <h1 className="main_title mb-0">{clientObject?.label}</h1>
                <ClientSelection className="head_select align-self-end" />
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
            <div className="profit_loss">
                <h2>Profit and Loss</h2>
                <h3>Demo Company (AU)</h3>
                <h4>For the year ended 30 June 2025</h4>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ITR Label</th>
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
