import React, { useEffect, useState } from 'react'
import { useClient } from '../contexts/ClientContexts'
import SheetComponent from '../components/SheetComponent'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Loader from '../components/Loader'

const Spreadsheet = () => {
  const params = useParams()

  const { clientObject, setClientObject, getSingleClient } = useClient()
  const [isLoading, setIsLoading] = useState(true)

  const fetchSingleClient = async () => {
    const data = await getSingleClient(params?.id)
    if (data._id) {
      setClientObject({
        label: data.entity_name ? data.entity_name : `${data.first_name} ${data.last_name}`,
        value: data._id,
      })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (params?.id) {
      fetchSingleClient()
    }

    return () => {
      setClientObject({});
    };
  }, [])

  useEffect(() => {
    if (clientObject?.value) {
      setIsLoading(false)
    }
  }, [clientObject?.value])

  return (
    <>
      <Layout showSelection={true}>
        {isLoading === true && !clientObject?.value ? (
          <Loader />
        ) : (
          <>
            <SheetComponent clientId={clientObject?.value} sheetLoading={isLoading} setSheetLoading={setIsLoading} />
          </>
        )}
      </Layout>
    </>
  )
}

export default Spreadsheet
