import React from 'react'
import Accounts from '../components/Accounts'
import { useParams } from 'react-router-dom';

const ChartOfAccounts = () => {
    const params = useParams();

    return (
        <>
            <Accounts clientId={params?.id} showSlection={false} />
        </>
    )
}

export default ChartOfAccounts
