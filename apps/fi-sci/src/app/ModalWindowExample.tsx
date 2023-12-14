import { Hyperlink } from '@fi-sci/misc';
import { FunctionComponent } from 'react';
import ModalWindow, { useModalWindow } from '@fi-sci/modal-window';

type Props = {
  // no props
};

const ModalWindowExample: FunctionComponent<Props> = () => {
  const { visible, handleOpen, handleClose } = useModalWindow();
  return (
    <div>
      <Hyperlink onClick={handleOpen}>Click to open modal window</Hyperlink>
      <ModalWindow visible={visible} onClose={handleClose}>
        <div>This is a modal window.</div>
      </ModalWindow>
    </div>
  );
};

export default ModalWindowExample;
