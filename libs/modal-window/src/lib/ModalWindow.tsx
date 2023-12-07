import { Close } from '@mui/icons-material';
import { Dialog, IconButton } from '@mui/material';
import { FunctionComponent, PropsWithChildren, useCallback, useMemo, useState } from 'react';
import useWindowDimensions from './useWindowDimensions';

type Props = {
    visible: boolean
    onClose?: () => void
    overflow?: 'hidden' | 'auto'
    padding?: number
}

const ModalWindow: FunctionComponent<PropsWithChildren<Props>> = ({ onClose, visible, children, padding, overflow }) => {
    const {width, height} = useWindowDimensions()
    const ss = Math.min(width, height)

    const margin = (
        ss < 400 ? 0 :
        ss < 500 ? 10 :
        ss < 600 ? 20 :
        ss < 800 ? 30 :
        ss < 1000 ? 40 :
        50
    )

    const pp = padding !== undefined ? padding : 20

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const child = children as any

    const topBarHeight = onClose ? 50 : 0

    const W = width - margin * 2 - 10
    const H = height - margin * 2 - 10
    const H2 = H - topBarHeight

    return (
        <Dialog
            fullScreen
            open={visible}
            onClose={onClose}
            style={{
                zIndex: 9999,
                left: margin,
                top: margin,
                right: margin,
                bottom: margin,
                background: 'white',
                position: 'absolute',
                border: '2px solid #000'
            }}
        >
            <div style={{zIndex: 9999, position: 'absolute', width: W, height: H, overflow: 'hidden'}}>
                <div style={{position: 'absolute', padding: 20}}>
                    {
                        onClose && <IconButton onClick={onClose}><Close /></IconButton>
                    }
                </div>
                <div style={{position: 'absolute', left: pp, width: W - pp * 2, top: topBarHeight + pp, height: H2 - pp * 2, overflow: overflow || 'auto'}}>
                    {
                        child && <child.type {...child.props} width={W - pp * 2} height={H2 - pp * 2}/>
                    }
                </div>
            </div>
        </Dialog>
    )
}

export const useModalWindow = () => {
    const [visible, setVisible] = useState<boolean>(false)
    const handleOpen = useCallback(() => {
        setVisible(true)
    }, [])
    const handleClose = useCallback(() => {
        setVisible(false)
    }, [])
    return useMemo(() => ({
        visible,
        handleOpen,
        handleClose
    }), [visible, handleOpen, handleClose])
}

export default ModalWindow