import { FunctionComponent, useEffect, useState } from "react";
import GithubMarkdownContent from "./GithubMarkdownContent";

type Props ={
	width: number
	height: number
}

const useMarkdownContent = () => {
	const [markdownContent, setMarkdownContent] = useState<string | undefined>()
	const [error, setError] = useState<string | undefined>()

	useEffect(() => {
		let canceled = false
		;(async () => {
			setError(undefined)
			setMarkdownContent(undefined)
			let resp: Response
			try {
				resp = await fetch('./documents/index.md')
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			catch(err: any) {
				setError(`${err.message}`)
				return
			}
			if (canceled) return
			if (resp.status !== 200) {
				setError(`Error: ${resp.status}`)
				return
			}
			const text = await resp.text()
			if (canceled) return
			setMarkdownContent(text)
		})()
		return () => {
			canceled = true
		}
	}, [])

	return {markdownContent, error}
}

const MainWindowDocFigurlMode: FunctionComponent<Props> = ({width, height}) => {
	// const location = useLocation()

	// const ghSourceUri = `${location.pathname.slice('/gh/'.length)}`

	// const {markdownContent, error} = useGithubMarkdownContent(ghSourceUri)

	const {markdownContent, error} = useMarkdownContent()

	// if (!location.pathname.startsWith('/gh/')) {
	// 	return (
	// 		<div>Invalid path</div>
	// 	)
	// }
	if (error) {
		return <div style={{color: 'red'}}>Error: {error}</div>
	}
	if (!markdownContent) {
		return <div>Loading markdown</div>
		// return <div>Loading markdown from {ghSourceUri}</div>
	}
	// const ghSourceUrl = `https://github.com/${ghSourceUri}`
	return (
		<div
			// tabIndex={0}
			// onKeyDown={handleKeyDown}
		>
			{/* <div style={{color: '#aaaaff', textAlign: 'center'}}>
				<br />
				Viewing <a style={{color: 'inherit'}} href={ghSourceUrl} target="_blank" rel="noreferrer">{ghSourceUrl}</a>
			</div> */}
			<GithubMarkdownContent
				markdown={markdownContent}
				internalFigureMode={false}
				width={width}
				height={height}
			/>
		</div>
	)
}

export default MainWindowDocFigurlMode
