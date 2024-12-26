import React, { useEffect, useState } from 'react';
import { useClient } from '../contexts/ClientContexts';
import SheetComponent from '../components/SheetComponent';
import { useParams } from 'react-router-dom';
import Loader from '../components/Loader';
import Layout1 from '../components/Layout1';

const CollaborativeSheet = () => {
  const params = useParams();
  const { clientObject, setClientObject, getSharedClient } = useClient();
  const [isLoading, setIsLoading] = useState(true);
  const [showPage, setShowPage] = useState(false);

  const fetchSingleClient = async () => {
    try {
      const data = await getSharedClient(params?.id);
      if (!data.error && data?.client?._id) {
        setClientObject({
          label: data.client.entity_name || `${data.client.first_name} ${data.client.last_name}`,
          value: data.client._id,
        });
        setShowPage(true)
      } else {
        setShowPage(false)
      }
    } catch (error) {
      console.error('Error fetching single client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchSingleClient();
    } else {
      setIsLoading(false)
    }

    return () => {
      setClientObject({ label: '', value: '' });
    };
  }, [params?.id]);

  return (
    <>
      {!showPage ? (
        <p>404 Not Found</p>
      ) : (
        <Layout1>
          {isLoading && !params?.id ? (
            <Loader />
          ) : (
            <SheetComponent clientId={clientObject?.value} showSelection={true} disableSelection={true} />
          )}
        </Layout1>
      )}
    </>
  );
};

          export default CollaborativeSheet;
