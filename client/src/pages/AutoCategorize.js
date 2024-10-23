import React, { useEffect, useState } from 'react'
import { useClient } from '../contexts/ClientContexts'
import Layout from '../components/Layout';
import SheetComponent from '../components/SheetComponent';
import Loader from '../components/Loader';

const AutoCategorize = () => {
    const { getAllClients, clientObject, setClientObject, autoCategorize } = useClient()

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

    const categorize = async (id) => {
        setIsLoading(true)
        const data = await autoCategorize(id)
        if (!data?.error) {
            setIsLoading(false)
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
        if(clientObject?.value) {
            categorize(clientObject?.value)   
        }
    }, [clientObject?.value])
    

    return (
        <Layout showSelection={true}>
            {isLoading ? (
                <Loader />
            ) : (
                <SheetComponent clientId={clientObject?.value} showSelection={true} />
            )}
        </Layout>
    )
}

export default AutoCategorize
