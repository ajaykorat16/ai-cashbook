import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout';
import { useClient } from '../contexts/ClientContexts';
import moment from 'moment';
import Loader from '../components/Loader';
import ClientSelection from '../components/ClientSelection';
import DateRange from '../components/DateRange';

const quarterMapping = {
    'Q1': 'Jan - Mar',
    'Q2': 'Apr - Jun',
    'Q3': 'Jul - Sept',
    'Q4': 'Oct - Dec'
};

const GstReport = () => {
    const { getAllClients, clientObject, setClientObject, getGstReport } = useClient()

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [taxableAmt, setTaxableAmt] = useState([])
    const [taxableAmtTotal, setTaxableAmtTotal] = useState([])
    const [gstAmt, setGstAmt] = useState([])
    const [gstAmtTotal, setGstAmtTotal] = useState([])
    const [isLoading, setIsLoading] = useState(false)

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
            <DateRange
                fromDate={fromDate}
                setFromDate={setFromDate}
                setToDate={setToDate}
                toDate={toDate}
            />
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
