import React, { useEffect, useState } from 'react'
import { useClient } from '../contexts/ClientContexts'
import SheetComponent from '../components/SheetComponent'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Loader from '../components/Loader'

const Spreadsheet = () => {
  const params = useParams()

  const { getAllClients, clientObject, setClientObject, getSingleClient } = useClient()
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
    if (params?.id) {
      fetchSingleClient()
    } else {
      if (!clientObject?.value) {
        fetchClient()
      } else {
        setClientObject({
          label: clientObject?.label,
          value: clientObject?.value,
        })
      }
    }

    return setClientObject({})
  }, [])

  return (
    <>
      <Layout>
        {isLoading === true && !clientObject?.value ? (
          <Loader />
        ) : (
          <>
            <SheetComponent clientId={clientObject?.value} showSelection={true} />
          </>
        )}
      </Layout>
    </>
  )
}

export default Spreadsheet
