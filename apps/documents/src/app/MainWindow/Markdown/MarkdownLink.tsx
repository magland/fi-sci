import { Hyperlink } from "@fi-sci/misc";
import { FunctionComponent, PropsWithChildren, useCallback } from "react";

type Props ={
	href: string
}

const MarkdownLink: FunctionComponent<PropsWithChildren<Props>> = ({children, href}) => {
	const handleClick = useCallback(() => {
		window.location.hash = href
	}, [href])

	return (
		<Hyperlink onClick={handleClick}>{children}</Hyperlink>
	)
}

export default MarkdownLink
