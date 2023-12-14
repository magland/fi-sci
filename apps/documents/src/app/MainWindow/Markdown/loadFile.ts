async function httpGetAsync(url: string): Promise<{ text: string; request: XMLHttpRequest }> {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => {
      if (xmlHttp.readyState === 4) {
        if (xmlHttp.status === 200) {
          resolve({ text: xmlHttp.responseText, request: xmlHttp });
        } else {
          reject(`Problem getting ${url}: status ${xmlHttp.status}`);
        }
      }
    };
    xmlHttp.open('GET', url, true); // true for asynchronous
    xmlHttp.send(null);
  });
}

async function loadFile(uri: string) {
  if (!uri.startsWith('sha1://')) {
    throw Error(`Unexpected URI: ${uri}`);
  }
  const a = uri.split('?')[0].split('/');
  const sha1 = a[2];
  const url0 = `./sha1/${sha1}`;
  const { text } = await httpGetAsync(url0);
  return text;
}

export default loadFile;
