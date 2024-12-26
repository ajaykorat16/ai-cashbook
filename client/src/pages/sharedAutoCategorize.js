import React, { useEffect, useState } from 'react';
import { useClient } from '../contexts/ClientContexts';
import Layout1 from '../components/Layout1';
import Loader from '../components/Loader';
import moment from 'moment';
import { useNavigate, useParams } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

const SharedAutoCategorize = () => {
    const params = useParams();
    const { clientObject, setClientObject, autoCategorize, getSharedClient } = useClient();
    const navigate = useNavigate();

    const currentYearStart = moment().startOf('year');
    const currentYearEnd = moment().endOf('year');
    const [fromDate, setFromDate] = useState();
    const [toDate, setToDate] = useState();
    const [showPage, setShowPage] = useState(false);

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
    }, []);

    const hasCategorized = React.useRef(false);

    const categorize = async (id) => {
        if (id) {
            const data = await autoCategorize(id, fromDate, toDate);
            if (!data?.error) {
            }
            navigate(`/collabrative-sheet/${params?.id}`);
        } else {
            setShowPage(false)
        }
    };

    const fetchSingleClient = async () => {
        try {
            const data = await getSharedClient(params?.id);
            if (!data.error && data?.client?._id) {
                setClientObject({
                    label: data.client.entity_name || `${data.client.first_name} ${data.client.last_name}`,
                    value: data.client._id,
                });
                if (!hasCategorized.current && fromDate && toDate) {
                    categorize(data?.client?._id);
                    hasCategorized.current = true;
                }
                setShowPage(true)
            } else {
            }
        } catch (error) {
            console.error('Error fetching single client:', error);
        }
    };

    useEffect(() => {
        if (fromDate && toDate) {
            fetchSingleClient()
        }
    }, [fromDate, toDate])

    return (
        <>
            {!showPage ? (
                <NotFoundPage />
            ) : (
                <Layout1>
                    <Loader />
                </Layout1>
            )}
        </>
    );
};

export default SharedAutoCategorize;
