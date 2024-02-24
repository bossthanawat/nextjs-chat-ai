import SimpleBarReact, { Props as ScrollbarProps } from 'simplebar-react';
import React, { ReactNode } from 'react';

interface Props extends ScrollbarProps {
  children?: ReactNode;
}

export default function Scrollbar({ children, style, ...other }: Props) {
  const userAgent =
    typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  if (isMobile) {
    return (
      <div style={{ overflowX: 'auto', ...style }} {...other}>
        {children}
      </div>
    );
  }

  return (
    <SimpleBarReact clickOnTrack={false} {...other}>
      {children}
    </SimpleBarReact>
  );
}
