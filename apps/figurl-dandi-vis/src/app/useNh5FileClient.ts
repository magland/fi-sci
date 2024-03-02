import { useEffect, useState } from 'react';
import { RemoteNh5FileClient } from './nh5';

const useNh5FileClient = (nh5Url?: string) => {
  const [client, setClient] = useState<RemoteNh5FileClient | undefined>(undefined);
  useEffect(() => {
    let canceled = false;
    if (!nh5Url) return;
    (async () => {
      const c = await RemoteNh5FileClient.create(nh5Url);
      if (canceled) return;
      setClient(c);
    })();
    return () => {
      canceled = true;
    };
  }, [nh5Url]);
  return client;
};

export default useNh5FileClient;
