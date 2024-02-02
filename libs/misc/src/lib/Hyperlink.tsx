import React, { FunctionComponent, PropsWithChildren } from 'react';

type Props = {
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
  href?: string;
  target?: string;
  title?: string;
};

const Hyperlink: FunctionComponent<PropsWithChildren<Props>> = ({
  children,
  onClick,
  color,
  disabled,
  href,
  target,
  title,
}) => {
  if (href) {
    return (
      <a href={href} title={title} target={target} style={{ cursor: 'pointer', color: color || 'darkblue' }}>
        {children}
      </a>
    );
  }
  return !disabled ? (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a onClick={onClick} title={title} style={{ cursor: 'pointer', color: color || 'darkblue' }}>
      {children}
    </a>
  ) : (
    <span title={title} style={{ color: 'gray' }}>{children}</span>
  );
};

export default Hyperlink;
