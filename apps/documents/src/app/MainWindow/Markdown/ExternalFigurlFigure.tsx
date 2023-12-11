import { FunctionComponent, useRef, useState } from "react";
import ReactVisibilitySensor from "react-visibility-sensor";
import FigurlFigureMenuBar from "./FigurlFigureMenuBar";

type Props = {
	src: string
	height: number
}

const ExternalFigurlFigure: FunctionComponent<Props> = ({src, height}) => {
	const [visible, setVisible] = useState(true)
	return (
		<div>
			<FigurlFigureMenuBar
				src={src}
				visible={visible}
				setVisible={setVisible}
			/>
			{
				// Do the visibility this way so that the iframe doesn't need to reload when toggling visibility
				<div style={{overflow: "hidden", position: 'relative', height: visible ? height : 0}}>
					<ExternalFigurlFigureInner
						src={src}
						height={height}
					/>
				</div>
			}
		</div>
	)
}

const ExternalFigurlFigureInner: FunctionComponent<Props> = ({src, height}) => {
	const hasBeenVisible = useRef(false)
	return (
		<ReactVisibilitySensor partialVisibility={true}>
			{({isVisible}: {isVisible: boolean}) => {
				if (isVisible) {
					hasBeenVisible.current = true
				}
				return (
					isVisible || hasBeenVisible.current ? (
						<iframe
							title="external figurl figure"
							src={src + '&hide=1'}
							width="100%"
							height={height}
							frameBorder={0}
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

export default ExternalFigurlFigure
