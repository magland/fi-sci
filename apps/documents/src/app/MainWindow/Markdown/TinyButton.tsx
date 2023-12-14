import { FunctionComponent, useMemo } from 'react';
import './TinyButton.css';

type Props = {
  onClick: () => void;
  width: number;
  height: number;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
};

const TinyButton: FunctionComponent<Props> = ({ onClick, width, height, title, icon }) => {
  const styleOuter: React.CSSProperties = useMemo(
    () => ({
      position: 'relative',
      width,
      height,
      fontSize: height - 2,
      marginTop: 0,
      marginRight: 6,
    }),
    [width, height]
  );
  const IconType = icon.type;
  return (
    <div style={styleOuter} className="TinyButton" onClick={onClick} title={title}>
      <IconType {...icon.props} fontSize="inherit" />
    </div>
  );
};

export default TinyButton;
