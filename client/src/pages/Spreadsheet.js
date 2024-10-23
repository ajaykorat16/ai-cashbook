import React, { useEffect } from 'react'
import { useClient } from '../contexts/ClientContexts'
import SheetComponent from '../components/SheetComponent'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'

const Spreadsheet = () => {
  const params = useParams()

  const { clientObject, setClientObject, getSingleClient } = useClient()

  const fetchSingleClient = async () => {
    const data = await getSingleClient(params?.id)
    if (data._id) {
      setClientObject({
        label: data.entity_name ? data.entity_name : `${data.first_name} ${data.last_name}`,
        value: data._id,
      })
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

  return (
    <>
      <Layout showSelection={true}>
        <SheetComponent clientId={clientObject?.value} showSelection={true} />
      </Layout>
    </>
  )
}

export default Spreadsheet
