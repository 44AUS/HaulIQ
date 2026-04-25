import { forwardRef } from 'react';
import { sxToStyle } from '../../utils/sxToStyle';

const VARIANT_TAG = {
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
  subtitle1: 'p', subtitle2: 'p',
  body1: 'p', body2: 'p',
  caption: 'span', overline: 'span',
  inherit: 'span',
};

const VARIANT_STYLE = {
  h1:        { fontSize: '2.125rem', fontWeight: 700, lineHeight: 1.235 },
  h2:        { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3 },
  h3:        { fontSize: '1.5rem',   fontWeight: 700, lineHeight: 1.3 },
  h4:        { fontSize: '1.25rem',  fontWeight: 700, lineHeight: 1.35 },
  h5:        { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
  h6:        { fontSize: '1rem',     fontWeight: 600, lineHeight: 1.6 },
  subtitle1: { fontSize: '1rem',     fontWeight: 500, lineHeight: 1.75 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.57 },
  body1:     { fontSize: '1rem',     fontWeight: 400, lineHeight: 1.5 },
  body2:     { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
  caption:   { fontSize: '0.75rem',  fontWeight: 400, lineHeight: 1.66 },
  overline:  { fontSize: '0.75rem',  fontWeight: 400, lineHeight: 2.66, textTransform: 'uppercase', letterSpacing: '0.08em' },
};

const Typography = forwardRef(function Typography(
  { variant = 'body1', component, sx, style, children, noWrap, color, fontWeight, fontSize,
    display, align, gutterBottom, ...props },
  ref
) {
  const Tag = component || VARIANT_TAG[variant] || 'span';

  const base = VARIANT_STYLE[variant] || {};
  const sxStyle = sxToStyle(sx);

  const colorVal = color
    ? { 'text.primary': 'var(--ion-text-color)', 'text.secondary': 'var(--ion-color-medium)',
        'text.disabled': 'var(--ion-color-step-300)', 'primary.main': 'var(--ion-color-primary)',
        'error.main': 'var(--ion-color-danger)', 'warning.main': 'var(--ion-color-warning)',
        'success.main': 'var(--ion-color-success)', 'inherit': 'inherit' }[color] ?? color
    : undefined;

  const combined = {
    margin: 0,
    ...base,
    ...(noWrap && { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }),
    ...(colorVal && { color: colorVal }),
    ...(fontWeight && { fontWeight }),
    ...(fontSize && { fontSize }),
    ...(display && { display }),
    ...(align && { textAlign: align }),
    ...(gutterBottom && { marginBottom: '0.35em' }),
    ...sxStyle,
    ...style,
  };

  return (
    <Tag ref={ref} style={combined} {...props}>
      {children}
    </Tag>
  );
});

export default Typography;
