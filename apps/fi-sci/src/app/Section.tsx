import { FunctionComponent, PropsWithChildren } from "react"

type Props = {
    label: string
    width: number
}

const Section: FunctionComponent<PropsWithChildren<Props>> = ({ label, width, children }) => {
    const padding = 20
    const child = children as JSX.Element
    return (
        <div style={{ position: 'relative', width, padding }}>
            <hr />
            <h2>{label}</h2>
            <div style={{ position: 'relative', width: width - 2 * padding }}>
                <child.type {...child.props} width={width} />
            </div>
        </div>
    )
}

export default Section