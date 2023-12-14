import axios from 'axios';
import { FunctionComponent, useEffect, useState } from 'react';
import MainWindowDevMode from './MainWindowDevMode';
import MainWindowDocFigurlMode from './MainWindowDocFigurlMode';
import MainWindowFigurlToHtmlMode from './MainWindowFigurlToHtmlMode';
import { useWindowDimensions } from '@fi-sci/misc';

const urlSearchParams = new URLSearchParams(window.location.search);
const queryParams = Object.fromEntries(urlSearchParams.entries());

type Props = {
  // nothing
};

const useFigurlJson = () => {
  const [figurlJson, setFigurlJson] = useState<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { [key: string]: any } | null | undefined
  >();
  useEffect(() => {
    (async () => {
      // setFigurlJson({figurlToHtml: true})
      try {
        const resp = await axios.get('./figurl.json', { responseType: 'json' });
        if (resp.status === 200) {
          setFigurlJson(resp.data);
        } else {
          setFigurlJson(null);
        }
      } catch (err) {
        setFigurlJson(null);
      }
    })();
  }, []);
  return figurlJson;
};

const MainWindow: FunctionComponent<Props> = () => {
  const { width, height } = useWindowDimensions();

  const figurlJson = useFigurlJson();

  const figurlToHtmlMode =
    figurlJson === undefined ? undefined : figurlJson === null ? false : figurlJson['figurlToHtml'];

  if (figurlJson === undefined) {
    return <div>Loading figurl.json</div>;
  }

  if (queryParams.doc) {
    return <MainWindowDevMode docUrl={queryParams.doc} width={width} height={height} />;
  } else if (figurlToHtmlMode) {
    return <MainWindowFigurlToHtmlMode width={width} height={height} />;
  } else {
    return <MainWindowDocFigurlMode width={width} height={height} />;
  }
};

export default MainWindow;
