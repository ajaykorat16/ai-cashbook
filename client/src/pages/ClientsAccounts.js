import React, { useEffect } from 'react'
import Accounts from '../components/Accounts'
import { useClient } from '../contexts/ClientContexts'

const ClientsAccounts = () => {
    const { getAllClients, clientObject, setClientObject, getClientCategory, updateClientCatrgory } = useClient()

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
    return (
        <>
            <Accounts clientId={clientObject?.value} showSelection={true} getCsvData={getClientCategory} updateCsvData={updateClientCatrgory} />
        </>
    )
}

export default ClientsAccounts
