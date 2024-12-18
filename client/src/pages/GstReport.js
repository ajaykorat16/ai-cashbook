import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout';
import { useClient } from '../contexts/ClientContexts';
import moment from 'moment';
import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.css';
import 'jquery-ui-dist/jquery-ui';
import Loader from '../components/Loader';
import ClientSelection from '../components/ClientSelection';

const quarterMapping = {
    'Q1': 'Jan - Mar',
    'Q2': 'Apr - Jun',
    'Q3': 'Jul - Sept',
    'Q4': 'Oct - Dec'
};

const GstReport = () => {
    const { getAllClients, clientObject, setClientObject, getGstReport, showDateRange, calculateDateRange } = useClient()

    const [showMenu, setShowMenu] = useState(false)
    const currentYearStart = moment().startOf('year');
    const currentYearEnd = moment().endOf('year');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [taxableAmt, setTaxableAmt] = useState([])
    const [taxableAmtTotal, setTaxableAmtTotal] = useState([])
    const [gstAmt, setGstAmt] = useState([])
    const [gstAmtTotal, setGstAmtTotal] = useState([])
    const [isLoading, setIsLoading] = useState(false)

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
        setIsLoading(true)
        const formattedFromDate = moment(fromDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const formattedToDate = moment(toDate, 'MM/DD/YYYY').format('YYYY-MM-DD');
        const data = await getGstReport(clientObject?.value, formattedFromDate, formattedToDate)
        setTaxableAmt(data?.taxableAmtReport?.gstCodeResult)
        setTaxableAmtTotal(data?.taxableAmtReport?.gstCodeGrandTotal)
        setGstAmt(data?.gstAmtReport?.basLabnResult)
        setGstAmtTotal(data?.gstAmtReport?.basLabnGrandTotal)
        setIsLoading(false)
    }

    useEffect(() => {
        if (clientObject?.value && fromDate && toDate) {
            getReportData()
        }
    }, [clientObject?.value, fromDate, toDate])


    return (
        <Layout>
            <div className="special_flex d-flex justify-content-space-between">
                <h1 className="main_title mb-0">GST Report</h1>
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
                {isLoading ? (
                    <Loader />
                ) :
                    (
                        <div className="table-responsive">
                            <h6>Taxable amount report</h6>
                            <table>
                                <thead>
                                    <tr>
                                        <th>GST_Code</th>
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
                                                (
                                                    Object.keys(taxableAmtTotal)
                                                        .filter(key => /^\d{4}_Q\d$/.test(key) || key === 'Total_Result')
                                                        .map(key => {
                                                            const year = key.split('_')[0];
                                                            const quarter = key.split('_')[1];

                                                            const displayKey = `${quarterMapping[quarter] || ''}_${year}`;
                                                            if (displayKey !== '_Total') {
                                                                return <th key={key}>{displayKey}</th>;
                                                            }
                                                        })
                                                ))
                                        }
                                        <th>Total Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taxableAmt && taxableAmt.map((bas, index) => (
                                        <React.Fragment key={`${bas.basLabn}_${index}`}>
                                            <tr>
                                                <td>{bas.totalRow.BAS_Name}</td>
                                                <td></td>
                                                {Object.keys(bas.totalRow || {}).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarter, index) => (
                                                    <td key={index}>{bas.totalRow[quarter]}</td>
                                                ))}
                                                <td>{bas.totalRow.Total_Result}</td>
                                            </tr>
                                            {bas.categoryRows.map((category, index) => (
                                                <tr key={`${bas.basLabn}-${index}`}>
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
                                                Object.keys(gstAmtTotal)
                                                    .filter(key => /^\d{4}_Q\d$/.test(key) || key === 'Total_Result')
                                                    .map(key => {
                                                        const year = key.split('_')[0];
                                                        const quarter = key.split('_')[1];

                                                        const displayKey = `${quarterMapping[quarter] || ''}_${year}`;
                                                        if (displayKey !== '_Total') {
                                                            return <th key={key}>{displayKey}</th>;
                                                        }
                                                    })
                                            )
                                        }

                                        <th>Total Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gstAmt && gstAmt.map((bas, index) => (
                                        <React.Fragment key={`${bas.basLabn}_${index}`}>
                                            <tr key={`total-${bas.basLabn}`}>
                                                <td>{bas.totalRow.BAS_Name}</td>
                                                <td></td>
                                                {Object.keys(bas.totalRow).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarterKey) => (
                                                    <td key={`${bas.basLabn}-${quarterKey}`}>{bas.totalRow[quarterKey]}</td>
                                                ))}
                                                <td>{bas.totalRow.Total_Result}</td>
                                            </tr>
                                            {bas.categoryRows.map((category, index) => (
                                                <tr key={`${bas.basLabn}-category-${index}`}>
                                                    <td></td>
                                                    <td>{category.Tax_Category}</td>
                                                    {Object.keys(category).filter(key => /^\d{4}_Q\d$/.test(key)).map((quarterKey) => (
                                                        <td key={`${bas.basLabn}-${category.Tax_Category}-${quarterKey}`}>{category[quarterKey]}</td>
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
