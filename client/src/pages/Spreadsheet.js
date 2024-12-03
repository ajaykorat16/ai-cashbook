import React, { useEffect, useState } from 'react';
import { useClient } from '../contexts/ClientContexts';
import SheetComponent from '../components/SheetComponent';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Loader from '../components/Loader';

const Spreadsheet = () => {
  const params = useParams();
  const { getAllClients, clientObject, setClientObject, getSingleClient } = useClient();
  const [isLoading, setIsLoading] = useState(true);

  const fetchSingleClient = async () => {
    try {
      const data = await getSingleClient(params?.id);
      if (data?._id) {
        setClientObject({
          label: data.entity_name || `${data.first_name} ${data.last_name}`,
          value: data._id,
        });
      }
    } catch (error) {
      console.error('Error fetching single client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefaultClient = async () => {
    try {
      const { clients } = await getAllClients(1, 1, '_id', -1, '');
      if (clients?.length > 0) {
        setClientObject({
          label: clients[0].entity_name || `${clients[0].first_name} ${clients[0].last_name}`,
          value: clients[0]._id,
        });
      }
    } catch (error) {
      console.error('Error fetching default clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchSingleClient();
    } else if (!clientObject?.value) {
      fetchDefaultClient();
    } else {
      setIsLoading(false);
    }
  }, [params?.id, clientObject?.value]);

  return (
    <Layout>
      {isLoading ? (
        <Loader />
      ) : (
        <SheetComponent clientId={clientObject?.value} showSelection={true} />
      )}
    </Layout>
  );
};

export default Spreadsheet;
