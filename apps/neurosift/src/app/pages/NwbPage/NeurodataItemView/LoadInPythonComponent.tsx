import { FunctionComponent, useMemo } from "react"
import { useModalDialog } from "../../../ApplicationBar"
import { useNwbFile } from "../NwbFileContext"
import { MergedRemoteH5File, RemoteH5File, RemoteH5Group } from "@fi-sci/remote-h5-file"
import { findViewPluginsForType, ViewPlugin } from "../viewPlugins/viewPlugins"
import { Hyperlink } from "@fi-sci/misc"
import ModalWindow from "@fi-sci/modal-window"
import Markdown from "../../../Markdown/Markdown"

type Props = {
    path: string
    group: RemoteH5Group
    viewName: string
}

const LoadInPythonComponent: FunctionComponent<Props> = ({path, group, viewName}) => {
    const {visible: windowVisible, handleOpen: handleOpenWindow, handleClose: handleCloseWindow} = useModalDialog()

    return (
        <div>
            <Hyperlink onClick={handleOpenWindow}>Load in Python</Hyperlink>
            <ModalWindow
                visible={windowVisible}
                onClose={handleCloseWindow}
            >
                <LoadInPythonWindow
                    path={path}
                    group={group}
                    viewName={viewName}
                />
            </ModalWindow>
        </div>
    )
}

const LoadInPythonWindow: FunctionComponent<Props> = ({path, group, viewName}) => {
    const nwbFile = useNwbFile()

    let nwbFileUrl: string
    if (nwbFile instanceof MergedRemoteH5File) {
        const f = nwbFile.getFiles()[0]
        if (f instanceof RemoteH5File) {
            nwbFileUrl = f.url
        }
        else {
            nwbFileUrl = 'unknown'
        }
    }
    else {
        nwbFileUrl = nwbFile.url
    }

    const source = useMemo(() => {
        const viewPlugin = findViewPluginsForType(group.attrs.neurodata_type, {nwbFile}).defaultViewPlugin
        return createSource(nwbFileUrl, viewPlugin, path, group, viewName)
    }, [path, group, viewName, nwbFileUrl, nwbFile])
    return (
        <Markdown
            source={source}
        />
    )
}

const createSource = (url: string, viewPlugin: ViewPlugin | undefined, path: string, group: RemoteH5Group, viewName: string) => {
    const backtics = '```'
    const backtic = '`'
    // const nt = group.attrs.neurodata_type
    const customCode = viewPlugin && viewPlugin.getCustomPythonCode ? viewPlugin.getCustomPythonCode(group) : ''
    return `
## Loading ${backtic}${path}${backtic} (${backtic}${group.attrs.neurodata_type}${backtic}).

${backtics}bash
# Prerequisites:
pip install h5py remfile
${backtics}

${backtics}python
import h5py
import remfile

url = '${url}'

# open the remote file
f = h5py.File(remfile.File(url), 'r')

# load the neurodata object
X = f['${path}']
${customCode}
${backtics}

## Notes

See [remfile](https://github.com/magland/remfile) for more information on loading remote files.

`
}

export default LoadInPythonComponent