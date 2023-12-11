import { FunctionComponent, PropsWithChildren, useMemo } from "react";
import Markdown from "./Markdown/Markdown";
import processMarkdown from "./processMarkdown";

type Props ={
	markdown: string
	internalFigureMode: boolean
	width: number
	height: number
}

const GithubMarkdownContent: FunctionComponent<Props> = ({width, height, markdown, internalFigureMode}) => {
	const processedMarkdown = useMemo(() => (processMarkdown(markdown, {internalFigureMode})), [markdown, internalFigureMode])
	// useEffect(() => {
	// 	updateLocationHash()
	// }, [])
	return (
		<Wrapper
			width={width}
			height={height}
		>
			<Markdown source={processedMarkdown} internalFigureMode={internalFigureMode} />
		</Wrapper>
	)
}

const Wrapper: FunctionComponent<PropsWithChildren<{width: number, height: number}>> = ({children, width, height}) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const cc = children as any
	let hOuterMargin = 30
	const hInnerMargin = 100
	const maxInnerWidth = 1000
	const extra = width - hInnerMargin * 2 - hOuterMargin * 2 - maxInnerWidth
	if (extra > 0) {
		hOuterMargin += extra / 2
	}
	const vOuterMargin = 30
	const vInnerMargin = 30
	const W1 = width - hOuterMargin * 2
	const W2 = W1 - hInnerMargin * 2
	return (
		<div className="markdown-content" style={{position: 'relative', left: hOuterMargin, width: W1, top: vOuterMargin, border: 'solid 1px lightgray', paddingBottom: 100}}>
			<div style={{position: 'relative', left: hInnerMargin, width: W2, top: vInnerMargin}}>
				<cc.type {...cc.props} />
			</div>
		</div>
	)
}

export default GithubMarkdownContent
