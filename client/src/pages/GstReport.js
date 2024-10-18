import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout';
import { useClient } from '../contexts/ClientContexts';
import moment from 'moment';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.css';
import 'jquery-ui-dist/jquery-ui';
import Loader from '../components/Loader';

const quarterMapping = {
    'Q1': 'Jan - Mar',
    'Q2': 'Apr - Jun',
    'Q3': 'Jul - Sept',
    'Q4': 'Oct - Dec'
};

const GstReport = () => {
    const { getAllClients, clientObject, setClientObject, getGstReport } = useClient()

    const [showMenu, setShowMenu] = useState(false)
    const [fromDate, setFromDate] = useState()
    const [toDate, setToDate] = useState()
    const [taxableAmt, setTaxableAmt] = useState([])
    const [taxableAmtTotal, setTaxableAmtTotal] = useState([])
    const [gstAmt, setGstAmt] = useState([])
    const [gstAmtTotal, setGstAmtTotal] = useState([])
    const [isLoading, setIsLoading] = useState(false)

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
        setIsLoading(true)
        const formattedFromDate = moment(fromDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const formattedToDate = moment(toDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const data = await getGstReport(clientObject?.value, formattedFromDate, formattedToDate)
        setTaxableAmt(data?.taxableAmtReport?.basCodeResult)
        setTaxableAmtTotal(data?.taxableAmtReport?.basCodeGrandTotal)
        setGstAmt(data?.gstAmtReport?.basLabnResult)
        setGstAmtTotal(data?.gstAmtReport?.basLabnGrandTotal)
        setIsLoading(false)
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
                {isLoading ? (
                    <Loader />
                ) :
                    (
                        <div className="table-responsive">
                            <h6>Taxable amount report</h6>
                            <table>
                                <thead>
                                    <tr>
                                        <th>BAS_Code</th>
                                        <th>Tax_Category</th>
                                        {
                                            (taxableAmt.length > 0 ?
                                                Object.keys(taxableAmt[0].categoryRows[0])
                                                    .filter(key => /^\d{4}_Q\d$/.test(key) || key === 'Total_Result')
                                                    .map(key => {
                                                        const year = key.split('_')[0];
                                                        const quarter = key.split('_')[1];

                                                        const displayKey = `${quarterMapping[quarter] || ''}_${year}`;
                                                        return <th key={key}>{displayKey}</th>;
                                                    })
                                                :
                                                (Object.keys(gstAmt[0]?.totalRow || {})
                                                    .filter(key => /^\d{4}_Q\d$/.test(key))
                                                    .map((quarterKey) => {
                                                        const year = quarterKey.split('_')[0];
                                                        const quarter = quarterKey.split('_')[1];
                                                        const displayKey =`${quarterMapping[quarter] || ''}_${year}`;
                                                        return <th key={quarterKey}>{displayKey}</th>;
                                                    }))
                                            )
                                        }
                                        <th>Total Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taxableAmt && taxableAmt.map((bas) => (
                                        <React.Fragment key={bas.basCode}>
                                            <tr>
                                                <td>{bas.totalRow.BAS_Name}</td>
                                                <td></td>
                                                {Object.keys(bas.totalRow || {}).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarter, index) => (
                                                    <td key={index}>{bas.totalRow[quarter]}</td>
                                                ))}
                                                <td>{bas.totalRow.Total_Result}</td>
                                            </tr>
                                            {bas.categoryRows.map((category, index) => (
                                                <tr key={`${bas.basCode}-${index}`}>
                                                    <td></td>
                                                    <td>{category.Tax_Category}</td>
                                                    {Object.keys(category).filter(key => /^\d{4}_Q\d$/.test(key) || key === 'Total_Result').map((key, idx) => (
                                                        <>
                                                            <td key={idx}>{category[key]}</td>
                                                        </>
                                                    ))}
                                                    <td>{category.total}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {taxableAmtTotal && (
                                        <tr>
                                            <td>{taxableAmtTotal.BAS_Name}</td>
                                            <td>{taxableAmtTotal.Tax_Category}</td>
                                            {Object.keys(taxableAmtTotal || {}).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarter, index) => (
                                                <td key={index}>{taxableAmtTotal[quarter]}</td>
                                            ))}
                                            {taxableAmtTotal?.Total_Result && <td>{taxableAmtTotal.Total_Result}</td>}
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <h6 className='gst_report_label'>Gst amount report</h6>
                            <table>
                                <thead>
                                    <tr>
                                        <th>BAS_LabN</th>
                                        <th>Tax_Category</th>
                                        {
                                            (gstAmt.length > 0 ?
                                                Object.keys(gstAmt[0]?.totalRow || {})
                                                    .filter(key => /^\d{4}_Q\d$/.test(key))
                                                    .map((quarterKey) => {
                                                        const year = quarterKey.split('_')[0];
                                                        const quarter = quarterKey.split('_')[1];
                                                        const displayKey = `${quarterMapping[quarter] || ''}_${year}`;
                                                        return <th key={quarterKey}>{displayKey}</th>;
                                                    })
                                                :
                                                Object.keys(taxableAmt[0]?.categoryRows[0] || {})
                                                    .filter(key => /^\d{4}_Q\d$/.test(key))
                                                    .map((quarterKey) => {
                                                        const year = quarterKey.split('_')[0];
                                                        const quarter = quarterKey.split('_')[1];
                                                        const displayKey = `${quarterMapping[quarter] || ''}_${year}`;      
                                                        return <th key={quarterKey}>{displayKey}</th>;
                                                    })
                                            )
                                        }

                                        <th>Total Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gstAmt && gstAmt.map((bas) => (
                                        <React.Fragment key={bas.basCode}>
                                            <tr key={`total-${bas.basCode}`}>
                                                <td>{bas.totalRow.BAS_Name}</td>
                                                <td></td>
                                                {Object.keys(bas.totalRow).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarterKey) => (
                                                    <td key={`${bas.basCode}-${quarterKey}`}>{bas.totalRow[quarterKey]}</td>
                                                ))}
                                                <td>{bas.totalRow.Total_Result}</td>
                                            </tr>
                                            {bas.categoryRows.map((category, index) => (
                                                <tr key={`${bas.basCode}-category-${index}`}>
                                                    <td></td>
                                                    <td>{category.Tax_Category}</td>
                                                    {Object.keys(category).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarterKey) => (
                                                        <td key={`${bas.basCode}-${category.Tax_Category}-${quarterKey}`}>{category[quarterKey]}</td>
                                                    ))}
                                                    <td>{category.total}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    {gstAmtTotal && (
                                        <tr>
                                            <td>{gstAmtTotal.BAS_Name}</td>
                                            <td>{gstAmtTotal.Tax_Category}</td>
                                            {Object.keys(gstAmtTotal).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarterKey) => (
                                                <td key={quarterKey}>{gstAmtTotal[quarterKey]}</td>
                                            ))}
                                            {gstAmtTotal?.Total_Result && <td>{gstAmtTotal.Total_Result}</td>}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                }
            </div>
        </Layout>
    )
}

export default GstReport
