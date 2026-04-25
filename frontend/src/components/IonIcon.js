import { sxToStyle } from '../utils/sxToStyle';

const SIZE_MAP = {
  small:   '1.25rem',
  medium:  '1.5rem',
  large:   '2.1875rem',
  inherit: 'inherit',
};

const COLOR_VARS = {
  primary:   'var(--ion-color-primary)',
  secondary: 'var(--ion-color-secondary)',
  error:     'var(--ion-color-danger)',
  warning:   'var(--ion-color-warning)',
  info:      'var(--ion-color-tertiary, #5260ff)',
  success:   'var(--ion-color-success)',
  action:    'var(--ion-color-step-400)',
  disabled:  'var(--ion-color-step-300)',
  inherit:   'inherit',
};

export default function IonIcon({ name, sx, color, fontSize = '1rem', style, onClick, className, ...rest }) {
  const resolvedColor = COLOR_VARS[color] ?? color;
  const resolvedSize  = SIZE_MAP[fontSize] ?? fontSize;

  const combined = {
    display:         'inline-flex',
    alignItems:      'center',
    justifyContent:  'center',
    lineHeight:      0,
    flexShrink:      0,
    ...(resolvedColor && { color: resolvedColor }),
    ...(resolvedSize  && { fontSize: resolvedSize }),
    ...sxToStyle(sx),
    ...style,
  };

  return (
    <span onClick={onClick} className={className} style={combined} {...rest}>
      <ion-icon name={name} style={{ fontSize: 'inherit', color: 'inherit', pointerEvents: 'none' }} />
    </span>
  );
}
