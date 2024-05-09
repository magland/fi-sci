import { Splitter } from '@fi-sci/splitter';
import { AutoFixHigh, Settings, } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import StanCompileResultWindow from "./StanCompileResultWindow";
import TextEditor, { ToolbarItem } from "./TextEditor";
import runStanc from "./runStanc";
import compileStanProgram from '../compileStanProgram/compileStanProgram';
import StanModel from '../tinystan/StanModel';


type Props = {
    fileName: string
    fileContent: string
    onSaveContent: (text: string) => void
    editedFileContent: string
    setEditedFileContent: (text: string) => void
    onDeleteFile?: () => void
    readOnly: boolean
    width: number
    height: number
    onStanModelLoaded: (model: StanModel) => void
}

type CompileStatus = 'preparing' | 'compiling' | 'compiled' | 'failed' | ''

const StanFileEditor: FunctionComponent<Props> = ({fileName, fileContent, onSaveContent, editedFileContent, setEditedFileContent, readOnly, width, height, onStanModelLoaded}) => {
    const [validSyntax, setValidSyntax] = useState<boolean>(false)
    const handleAutoFormat = useCallback(() => {
        if (editedFileContent === undefined) return
        ;(async () => {
            const model = await runStanc('main.stan', editedFileContent, ["auto-format", "max-line-length=78"])
            if (model.result) {
                setEditedFileContent(model.result)
            }
        })()
    }, [editedFileContent, setEditedFileContent])

    const [compileStatus, setCompileStatus] = useState<CompileStatus>('')
    const [compileMessage, setCompileMessage] = useState<string>('')
    const [compileMainJsUrl, setCompileMainJsUrl] = useState<string>('')

    const handleCompile = useCallback(async () => {
        setCompileStatus('compiling')
        await new Promise(resolve => setTimeout(resolve, 500)) // for effect
        const onStatus = (msg: string) => {
            setCompileMessage(msg)
        }
        const {mainJsUrl} = await compileStanProgram(fileContent, onStatus)

        if (!mainJsUrl) {
            setCompileStatus('failed')
            return
        }
        setCompileMainJsUrl(mainJsUrl)
        setCompileStatus('compiled')
    }, [fileContent])

    useEffect(() => {
        let canceled = false
        ;(async () => {
            const js = await import(compileMainJsUrl);
            if (canceled) return
            const module = await StanModel.load(js.default, null);
            if (canceled) return
            onStanModelLoaded(module)
        })()
        return () => { canceled = true }
    }, [compileMainJsUrl])

    const toolbarItems: ToolbarItem[] = useMemo(() => {
        const ret: ToolbarItem[] = []

        // auto format
        if (!readOnly) {
            if (editedFileContent !== undefined) {
                ret.push({
                    type: 'button',
                    icon: <AutoFixHigh />,
                    tooltip: 'Auto format this stan file',
                    label: 'auto format',
                    onClick: handleAutoFormat,
                    color: 'darkblue'
                })
            }
        }
        if (editedFileContent === fileContent) {
            if (compileStatus !== 'compiling') {
                if (validSyntax) {
                    ret.push({
                        type: 'button',
                        tooltip: 'Compile Stan model',
                        label: 'compile',
                        icon: <Settings />,
                        onClick: handleCompile,
                        color: 'darkblue'
                    })
                }
            }
            if (compileStatus !== '') {
                ret.push({
                    type: 'text',
                    label: compileMessage,
                    color: compileStatus === 'compiled' ? 'green' : compileStatus === 'failed' ? 'red' : 'black'
                })
            }
        }

        return ret
    }, [editedFileContent, fileContent, handleAutoFormat, handleCompile, compileStatus, compileMessage, validSyntax, readOnly])

    const isCompiling = compileStatus === 'compiling'

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={height * 2 / 3}
            direction="vertical"
        >
            <TextEditor
                width={0}
                height={0}
                // language="stan"
                language="stan"
                label={fileName}
                text={fileContent}
                onSaveText={onSaveContent}
                editedText={editedFileContent}
                onSetEditedText={setEditedFileContent}
                readOnly={!isCompiling ? readOnly : true}
                toolbarItems={toolbarItems}
            />
            <StanCompileResultWindow
                width={0}
                height={0}
                mainStanText={editedFileContent}
                onValidityChanged={valid => setValidSyntax(valid)}
            />
        </Splitter>
    )
}

export default StanFileEditor