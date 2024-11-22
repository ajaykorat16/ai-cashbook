import React from 'react'
import Accounts from '../components/Accounts'
import { useAuth } from '../contexts/AuthContext'

function UserCategory() {
    const { getUserCategory, auth, updateUserCatrgory } = useAuth();

    return (
        <Accounts
            clientId={auth.user?._id}
            showSelection={false}
            getCsvData={getUserCategory}
            updateCsvData={updateUserCatrgory}
            title={`Master Category`}
        />
    )
}

export default UserCategory