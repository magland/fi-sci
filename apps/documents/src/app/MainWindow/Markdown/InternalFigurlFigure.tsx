import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactVisibilitySensor from "react-visibility-sensor";
import deserializeReturnValue from "./deserializeReturnValue";
import FigurlFigureMenuBar from "./FigurlFigureMenuBar";
import loadFile from "./loadFile";

type Props ={
	src: string
	height: number
}

const InternalFigurlFigure: FunctionComponent<Props> = ({src, height}) => {
	const [visible, setVisible] = useState(true)
	return (
		<div>
			<FigurlFigureMenuBar
				src={undefined}
				visible={visible}
				setVisible={setVisible}
			/>
			{
				// Do the visibility this way so that the iframe doesn't need to reload when toggling visibility
				<div style={{overflow: "hidden", position: 'relative', height: visible ? height : 0}}>
					<InternalFigurlFigureInner
						src={src}
						height={height}
					/>
				</div>
			}
		</div>
	)
}

const InternalFigurlFigureInner: FunctionComponent<Props> = ({src, height}) => {
	const hasBeenVisible = useRef(false)
	return (
		<ReactVisibilitySensor partialVisibility={true}>
			{({isVisible}: {isVisible: boolean}) => {
				if (isVisible) {
					hasBeenVisible.current = true
				}
				return (
					isVisible || hasBeenVisible.current ? (
						<InternalFigurlFigureChild
							src={src}
							height={height}
						/>
					) : (
						<div
							style={{position: 'relative', width: "100%", height}}
						>
							Waiting for visible
						</div>
					)
				)
			}
		}
		</ReactVisibilitySensor>
	)
}

const InternalFigurlFigureChild: FunctionComponent<Props> = ({src, height}) => {
	const figureId = useMemo(() => (randomAlphaString(10)), [])
	const iframeElement = useRef<HTMLIFrameElement | null>()
	const {viewUrl, query} = useMemo(() => (parseFigurl(src)), [src])
	const processedViewUrl = useMemo(() => (viewUrl.split('://').join('/')), [viewUrl])
	const handleFigurlRequest = useMemo(() => (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async (req: any) => {
			if (!query.d) {
				throw Error('No d parameter in query string.')
			}
			if (req.type === 'getFigureData') {
				const a = await loadFile(query.d)
				const figureData = await deserializeReturnValue(JSON.parse(a))
				return {
					type: 'getFigureData',
					figureData
				}
			}
			else if (req.type === 'getFileData') {
				const a = await loadFile(req.uri)
				const rt = req.responseType || 'json-deserialized'
				let fileData
				if (rt === 'json-deserialized') {
					fileData = await deserializeReturnValue(JSON.parse(a))
				}
				else if (rt === 'json') {
					fileData = JSON.parse(a)
				}
				else {
					fileData = a
				}
				return {
					type: 'getFileData',
					fileData
				}
			}
		}
	), [query.d])
	useEffect(() => {
		const listener = (e: MessageEvent) => {
			const msg = e.data
			if ((msg) && (msg.type === 'figurlRequest')) {
				if (msg.figureId !== figureId) return
				if (!iframeElement.current) throw Error('Unexpected: no iframeElement.current')
				if (!iframeElement.current.contentWindow) throw Error('Unexpected: no iframeElement.current.contentWindow')
				;(async () => {
					const response = await handleFigurlRequest(msg.request)
					iframeElement.current?.contentWindow?.postMessage({
						type: 'figurlResponse',
						requestId: msg.requestId,
						response
					}, '*')
				})()
			}
		}
		window.addEventListener('message', listener)
		return () => {
			window.removeEventListener('message', listener)
		}
	}, [figureId, handleFigurlRequest])
	const setIframeElement = useCallback((e: HTMLIFrameElement | null) => {
        if (iframeElement.current) return // already set
        iframeElement.current = e
        if (!e) {
            console.warn('Iframe element is null.')
            return
        }
		const cw = e.contentWindow
		if (!cw) {
			console.warn('No contentWindow for iframe element')
			return
		}
		// cw.onload = () => {
		// 	cw.postMessage({
		// 		type: 'initializeFigure',
		// 		parentOrigin: '*',
		// 		figureId,
		// 		s: query.s ? query.s : undefined
		// 	}, '*')
		// }
    }, [])

	const iframeSrc = `./views/${processedViewUrl}/index.html?parentOrigin=*&figureId=${figureId}&s=${query.s || "{}"}`
	return (
		<iframe
			ref={e => {setIframeElement(e)}}
			title="figure"
			src={iframeSrc}
			width="100%"
			height={height}
			frameBorder="0"
		/>
	)
}

const parseFigurl = (url: string) => {
	const queryString = url.split('?')[1] || ''
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const query: {[key: string]: any} = {}
	const a = queryString.split('&')
	for (const b of a) {
		const c = b.split('=')
		if (c.length === 2) {
			query[c[0]] = c[1]
		}
	}
	return {viewUrl: query.v || '', query}
}

export const randomAlphaString = (num_chars: number) => {
    if (!num_chars) {
        /* istanbul ignore next */
        throw Error('randomAlphaString: num_chars needs to be a positive integer.')
    }
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < num_chars; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

export default InternalFigurlFigure
