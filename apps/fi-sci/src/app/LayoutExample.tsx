import { HBoxLayout, VBoxLayout } from "@fi-sci/misc"
import { FunctionComponent } from "react"

// pastels
const color1 = '#ffc'
const color2 = '#fff'
const color3 = '#fcf'
const color4 = '#cff'

type Props = {
    width: number
}

const LayoutExample: FunctionComponent<Props> = ({width}) => {
    const height = 400
    return (
        <HBoxLayout
            widths={[300, width - 300]}
            height={height}
        >
            <LeftWindow width={0} height={0} />
            <RightWindow width={0} height={0} />
        </HBoxLayout>
    )
}
const LeftWindow: FunctionComponent<{ width: number, height: number }> = ({ width, height }) => (
    <div style={{ width, height, backgroundColor: color1, padding: 20 }}>
        <h3>Left panel</h3>
    </div>
)

const RightWindow: FunctionComponent<{ width: number, height: number }> = ({ width, height }) => {
    return (
        <VBoxLayout
            width={width}
            heights={[100, 100, height - 200]}
        >
            <WindowA width={0} height={0} />
            <WindowB width={0} height={0} />
            <WindowC width={0} height={0} />
        </VBoxLayout>
    )
}

const WindowA: FunctionComponent<{ width: number, height: number }> = ({ width, height }) => (
    <div style={{ width, height, backgroundColor: color2 }}>Window A</div>
)

const WindowB: FunctionComponent<{ width: number, height: number }> = ({ width, height }) => (
    <div style={{ width, height, backgroundColor: color3 }}>Window B</div>
)

const WindowC: FunctionComponent<{ width: number, height: number }> = ({ width, height }) => (
    <div style={{ width, height, backgroundColor: color4 }}>Window C</div>
)

export default LayoutExample