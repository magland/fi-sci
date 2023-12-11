import { ExpandMore, Launch, Remove } from "@mui/icons-material";
import { FunctionComponent, useCallback } from "react";
import TinyButton from "./TinyButton";

type Props ={
	src?: string
	visible: boolean
	setVisible: (v: boolean) => void
}

const ss = 14

const style0: React.CSSProperties = {
	position: 'relative',
	width: '100%',
	height: ss,
	background: 'lightgray'
	// background: '#65a6fc'
}

const FigurlFigureMenuBar: FunctionComponent<Props> = ({src, visible, setVisible}) => {
	const handleOpen = useCallback(() => {
		window.open(src, '_blank')
	}, [src])
	return (
		<div
			style={style0}
		>
			{
				src && (
					<div style={{float: 'right'}}>
						<TinyButton
							onClick={handleOpen}
							width={ss}
							height={ss}
							icon={<Launch />}
							title="Open in new tab"
						/>
					</div>
				)
			}
			<div style={{float: 'right'}}>
				<TinyButton
					onClick={() => setVisible(!visible)}
					width={ss}
					height={ss}
					icon={visible ? <Remove /> : <ExpandMore />}
					title="Toggle visibility"
				/>
			</div>
		</div>
	)
}

export default FigurlFigureMenuBar
