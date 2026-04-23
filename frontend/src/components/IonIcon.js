import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

const SIZE_MAP = {
  small:   '1.25rem',
  medium:  '1.5rem',
  large:   '2.1875rem',
  inherit: 'inherit',
};

export default function IonIcon({ name, sx, color, fontSize = '1.3rem', style, onClick, className, ...rest }) {
  const theme = useTheme();

  // Resolve MUI theme color shorthands
  const colorMap = {
    primary:   theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    error:     theme.palette.error.main,
    warning:   theme.palette.warning.main,
    info:      theme.palette.info.main,
    success:   theme.palette.success.main,
    action:    theme.palette.action.active,
    disabled:  theme.palette.action.disabled,
    inherit:   'inherit',
  };

  const resolvedColor    = colorMap[color] || color;
  const resolvedFontSize = SIZE_MAP[fontSize] || fontSize;

  return (
    <Box
      component="span"
      onClick={onClick}
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
        flexShrink: 0,
        ...(resolvedColor    && { color:    resolvedColor }),
        ...(resolvedFontSize && { fontSize: resolvedFontSize }),
        ...sx,
      }}
      style={style}
      {...rest}
    >
      <ion-icon name={name} style={{ fontSize: 'inherit', color: 'inherit', pointerEvents: 'none' }} />
    </Box>
  );
}
