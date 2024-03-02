import { FunctionComponent, useEffect } from "react"
import useNwbFileAnnotations from "../NwbFileAnnotations/useNwbFileAnnotations"
import { Hyperlink } from "@fi-sci/misc"

type NeurosiftAnnotationsViewProps = {
    width: number
    height: number
}

const NeurosiftAnnotationsView: FunctionComponent<NeurosiftAnnotationsViewProps> = ({ width, height }) => {
    const {nwbFileAnnotations, refreshNwbFileAnnotations, setNwbFileAnnotations} = useNwbFileAnnotations()
    useEffect(() => {
        refreshNwbFileAnnotations()
    }, [refreshNwbFileAnnotations])
    console.log(nwbFileAnnotations)
    return (
        <div style={{ position: 'absolute', width, height }}>
            <div style={{ position: 'absolute', width, height, backgroundColor: 'lightgray' }}>
                NeurosiftAnnotationsView
                <div>
                    <Hyperlink onClick={() => {
                        setNwbFileAnnotations([{
                            type: 'note',
                            id: 'test-id',
                            owner: 'magland',
                            timestamp: Date.now(),
                            data: {}
                        }])
                    }}>
                        TEST
                    </Hyperlink>
                </div>
            </div>
        </div>
    )
}

export default NeurosiftAnnotationsView;

