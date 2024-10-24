import React, { useEffect, useState } from 'react'
import { useClient } from '../contexts/ClientContexts'
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

const AutoCategorize = () => {
    const {clientObject,autoCategorize } = useClient()

    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    const categorize = async (id) => {
        const data = await autoCategorize(id)
        if (!data?.error) {
            setIsLoading(false)
            navigate(`/user/spreadsheet/${clientObject?.value}`)
        }
    }

    useEffect(() => {
        if (clientObject?.value) {
            setIsLoading(true)
            categorize(clientObject?.value)
        }
    }, [])


    return (
        <Layout showSelection={false}>
            {isLoading === true  && (
                <Loader />
            )}
        </Layout>
    )
}

export default AutoCategorize
