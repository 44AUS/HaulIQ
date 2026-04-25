const BASE = 8;
const sp = (v) => (typeof v === 'number' ? `${v * BASE}px` : v);
const border = (v) => (v === 1 ? '1px solid' : v === 0 ? 'none' : v);

const COLORS = {
  'background.paper':    'var(--ion-card-background)',
  'background.default':  'var(--ion-background-color)',
  'text.primary':        'var(--ion-text-color)',
  'text.secondary':      'var(--ion-color-medium)',
  'text.disabled':       'var(--ion-color-step-300)',
  'primary.main':        'var(--ion-color-primary)',
  'primary.light':       'var(--ion-color-primary-tint)',
  'primary.dark':        'var(--ion-color-primary-shade)',
  'secondary.main':      'var(--ion-color-secondary)',
  'secondary.dark':      'var(--ion-color-secondary-shade)',
  'error.main':          'var(--ion-color-danger)',
  'error.light':         'var(--ion-color-danger-tint)',
  'warning.main':        'var(--ion-color-warning)',
  'warning.dark':        'var(--ion-color-warning-shade)',
  'success.main':        'var(--ion-color-success)',
  'success.light':       'var(--ion-color-success-tint)',
  'info.main':           'var(--ion-color-tertiary)',
  'divider':             'var(--ion-border-color)',
  'action.hover':        'var(--ion-color-step-50)',
  'action.selected':     'var(--ion-color-step-100)',
  'action.active':       'var(--ion-color-step-400)',
  'action.disabled':     'var(--ion-color-step-300)',
  'inherit':             'inherit',
  'transparent':         'transparent',
};

const resolveColor = (v) => COLORS[v] ?? v;

// For responsive sx values like { xs: 2, sm: 3, lg: 4 }, pick sm or xs
const pickResponsive = (v) => {
  if (typeof v !== 'object' || Array.isArray(v)) return v;
  return v.sm ?? v.xs ?? v.md ?? v.lg ?? Object.values(v)[0];
};

export function sxToStyle(sx) {
  if (!sx || typeof sx !== 'object') return {};
  const style = {};

  for (let [k, raw] of Object.entries(sx)) {
    if (k.startsWith('&') || k.startsWith('.') || k.startsWith('@')) continue;
    const v = pickResponsive(raw);
    if (v === undefined || v === null) continue;

    switch (k) {
      case 'm':         style.margin         = sp(v); break;
      case 'mt':        style.marginTop      = sp(v); break;
      case 'mb':        style.marginBottom   = sp(v); break;
      case 'ml':        style.marginLeft     = sp(v); break;
      case 'mr':        style.marginRight    = sp(v); break;
      case 'mx':        style.marginLeft = style.marginRight = sp(v); break;
      case 'my':        style.marginTop  = style.marginBottom = sp(v); break;
      case 'p':         style.padding        = sp(v); break;
      case 'pt':        style.paddingTop     = sp(v); break;
      case 'pb':        style.paddingBottom  = sp(v); break;
      case 'pl':        style.paddingLeft    = sp(v); break;
      case 'pr':        style.paddingRight   = sp(v); break;
      case 'px':        style.paddingLeft = style.paddingRight = sp(v); break;
      case 'py':        style.paddingTop  = style.paddingBottom = sp(v); break;
      case 'gap':       style.gap            = sp(v); break;
      case 'rowGap':    style.rowGap         = sp(v); break;
      case 'columnGap': style.columnGap      = sp(v); break;
      case 'bgcolor':   style.backgroundColor = resolveColor(v); break;
      case 'color':     style.color           = resolveColor(v); break;
      case 'borderColor': style.borderColor   = resolveColor(v); break;
      case 'border':      style.border        = border(v); break;
      case 'borderTop':   style.borderTop     = border(v); break;
      case 'borderBottom':style.borderBottom  = border(v); break;
      case 'borderLeft':  style.borderLeft    = border(v); break;
      case 'borderRight': style.borderRight   = border(v); break;
      default:
        style[k] = typeof v === 'string' && COLORS[v] ? resolveColor(v) : v;
    }
  }

  return style;
}
