import React, { useEffect, useState } from 'react';
import { useClient } from '../contexts/ClientContexts';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

const AutoCategorize = () => {
    const { getAllClients, clientObject, setClientObject, getSingleClient, autoCategorize } = useClient();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const hasCategorized = React.useRef(false);

    const categorize = async (id) => {
        const data = await autoCategorize(id);
        if (!data?.error) {
            setIsLoading(false);
            navigate(`/user/spreadsheet/${id}`);
        }
    };

    useEffect(() => {

    }, []);

    const fetchClient = async () => {
        const { clients } = await getAllClients(1, 1, "_id", -1, "")
        if (clients.length > 0) {
            setClientObject({
                label: clients[0].entity_name ? clients[0].entity_name : `${clients[0].first_name} ${clients[0].last_name}`,
                value: clients[0]._id,
            })
            if (!hasCategorized.current) {
                setIsLoading(true);
                categorize(clients[0]._id);
                hasCategorized.current = true;
            }
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
            if (!hasCategorized.current) {
                setIsLoading(true);
                categorize(clientObject?.value);
                hasCategorized.current = true;
            }
        }
    }, [])


    return (
        <Layout>
            {isLoading && (
                <Loader />
            )}
        </Layout>
    );
};

export default AutoCategorize;
