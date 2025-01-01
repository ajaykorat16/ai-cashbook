import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout';
import { useClient } from '../contexts/ClientContexts';
import moment from 'moment';
import ClientSelection from '../components/ClientSelection';
import DateRange from '../components/DateRange';

const ItrReport = () => {
    const { getAllClients, clientObject, setClientObject, getItrReport } = useClient()

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [itrReport, setItrRport] = useState([])
    const [totalExcGst, setTotaltotalExcGst] = useState([])

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
