import React from 'react'
import Accounts from '../components/Accounts'
import { useParams } from 'react-router-dom';
import { useClient } from '../contexts/ClientContexts';

const ChartOfAccounts = () => {
    const params = useParams();
    const { getClientCategory, updateClientCatrgory } = useClient();

    return (
        <>
            <Accounts
                clientId={params?.id}
                showSelection={false}
                getCsvData={getClientCategory}
                updateCsvData={updateClientCatrgory}
                title={'Chart Of Accounts'}
            />
        </>
    )
}

export default ChartOfAccounts
