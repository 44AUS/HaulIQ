import { forwardRef } from 'react';
import { sxToStyle } from '../../utils/sxToStyle';

const Box = forwardRef(function Box({ sx, component, children, style, ...props }, ref) {
  const Tag = component || 'div';
  const combined = { ...sxToStyle(sx), ...style };
  return (
    <Tag ref={ref} style={combined} {...props}>
      {children}
    </Tag>
  );
});

export default Box;
