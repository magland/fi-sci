import { FunctionComponent, useEffect, useState } from "react";
import Markdown from "../../Markdown/Markdown";

type Props = {
    width: number
    height: number
}

const ProjectImportFiles: FunctionComponent<Props> = ({width, height}) => {
    const [mdSource, setMdSource] = useState<string | undefined>()
    useEffect(() => {
        ;(async () => {
            const response = await fetch('/project-import-files.md')
            const text = await response.text()
            setMdSource(text)
        })()
    }, [])
    if (!mdSource) {
        return <div>Loading markdown...</div>
    }
    return (
        <div style={{position: 'absolute', left: 15, top: 15, width: width - 30, height: height - 30, overflowY: 'auto'}}>
            <Markdown
                source={mdSource}
            />
        </div>

    )
}

export default ProjectImportFiles