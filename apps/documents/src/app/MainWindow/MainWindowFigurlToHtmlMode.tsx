import axios, { AxiosResponse } from 'axios';
import { FunctionComponent, useEffect, useState } from 'react';
import GithubMarkdownContent from './GithubMarkdownContent';

type Props = {
  width: number;
  height: number;
};

const useFigurlToHtmlMarkdownContent = () => {
  const [markdownContent, setMarkdownContent] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  useEffect(() => {
    (async () => {
      setError(undefined);
      setMarkdownContent(undefined);
      let resp: AxiosResponse;
      try {
        resp = await axios.get('./index.md', { responseType: 'text' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(`${err.message}`);
        return;
      }
      setMarkdownContent(resp.data);
    })();
  }, []);
  return { markdownContent, error };
};

const MainWindowFigurlToHtmlMode: FunctionComponent<Props> = ({ width, height }) => {
  const { markdownContent, error } = useFigurlToHtmlMarkdownContent();

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }
  if (!markdownContent) {
    return <div>Loading markdown</div>;
  }
  return <GithubMarkdownContent markdown={markdownContent} internalFigureMode={true} width={width} height={height} />;
};

export default MainWindowFigurlToHtmlMode;
