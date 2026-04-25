#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

// ── Full icon mapping ─────────────────────────────────────────────────────────
const ICON_MAP = {
  AccessTimeIcon:          'time-outline',
  AccountBalanceIcon:      'wallet-outline',
  ActivityIcon:            'analytics-outline',
  AddCircleOutlineIcon:    'add-circle-outline',
  AddCommentIcon:          'chatbox-outline',
  AddIcon:                 'add-outline',
  AddPhotoAlternateIcon:   'image-outline',
  AlertCircleIcon:         'alert-circle-outline',
  ArrowBackIcon:           'arrow-back-outline',
  ArrowForwardIcon:        'arrow-forward-outline',
  ArticleIcon:             'document-text-outline',
  AssignmentIcon:          'clipboard-outline',
  AttachMoneyIcon:         'cash-outline',
  AutoFixHighIcon:         'sparkles-outline',
  BadgeIcon:               'id-card-outline',
  BeachAccessIcon:         'umbrella-outline',
  BlockIcon:               'ban-outline',
  BoltIcon:                'flash-outline',
  BookmarkAddedIcon:       'bookmark-outline',
  BookmarkBorderIcon:      'bookmark-outline',
  BookmarkIcon:            'bookmark',
  BusinessCenterIcon:      'briefcase-outline',
  BusinessIcon:            'business-outline',
  CalculateIcon:           'calculator-outline',
  CalendarTodayIcon:       'calendar-outline',
  CameraAltIcon:           'camera-outline',
  CancelIcon:              'close-circle-outline',
  CategoryIcon:            'grid-outline',
  ChatBubbleOutlineIcon:   'chatbubble-outline',
  ChatIcon:                'chatbubble-outline',
  CheckCircleIcon:         'checkmark-circle',
  CheckCircleOutlineIcon:  'checkmark-circle-outline',
  CheckIcon:               'checkmark-outline',
  ChevronLeftIcon:         'chevron-back-outline',
  ChevronRightIcon:        'chevron-forward-outline',
  CircleIcon:              'ellipse',
  ClearIcon:               'close-outline',
  CloseIcon:               'close-outline',
  ContentCopyIcon:         'copy-outline',
  CreditCardIcon:          'card-outline',
  DeleteIcon:              'trash-outline',
  DeleteOutlineIcon:       'trash-outline',
  DescriptionIcon:         'document-text-outline',
  DoneAllIcon:             'checkmark-done-outline',
  DoneIcon:                'checkmark-outline',
  DragIndicatorIcon:       'reorder-three-outline',
  DrawIcon:                'pencil-outline',
  EditIcon:                'create-outline',
  EditNoteIcon:            'create-outline',
  EmailIcon:               'mail-outline',
  ErrorOutlineIcon:        'alert-circle-outline',
  EventAvailableIcon:      'calendar-outline',
  ExpandMoreIcon:          'chevron-down-outline',
  ExtensionIcon:           'extension-puzzle-outline',
  FiberManualRecordIcon:   'ellipse',
  FiberNewIcon:            'sparkles-outline',
  FileDownloadIcon:        'download-outline',
  FilterListIcon:          'funnel-outline',
  FlagIcon:                'flag-outline',
  FlashOnIcon:             'flash-outline',
  FolderIcon:              'folder-outline',
  FolderOpenIcon:          'folder-open-outline',
  GppBadIcon:              'shield-outline',
  GroupIcon:               'people-outline',
  HistoryIcon:             'time-outline',
  HowToRegIcon:            'checkmark-circle-outline',
  HubIcon:                 'git-network-outline',
  InfoOutlinedIcon:        'information-circle-outline',
  InsertDriveFileIcon:     'document-outline',
  InventoryIcon:           'cube-outline',
  LayersIcon:              'layers-outline',
  ListIcon:                'list-outline',
  LocalShippingIcon:       'car-sport-outline',
  LocationOnIcon:          'location-outline',
  LockIcon:                'lock-closed-outline',
  MailIcon:                'mail-outline',
  MapIcon:                 'map-outline',
  MarkEmailReadIcon:       'mail-open-outline',
  MessageIcon:             'chatbubble-outline',
  MoreHorizIcon:           'ellipsis-horizontal-outline',
  MoreVertIcon:            'ellipsis-vertical-outline',
  NavigateBeforeIcon:      'chevron-back-outline',
  NavigateNextIcon:        'chevron-forward-outline',
  NavigationIcon:          'navigate-outline',
  NetworkCheckIcon:        'wifi-outline',
  NightlightIcon:          'moon-outline',
  NotificationsActiveIcon: 'notifications-outline',
  NotificationsIcon:       'notifications-outline',
  NotificationsOffIcon:    'notifications-off-outline',
  OpenInNewIcon:           'open-outline',
  PaletteIcon:             'color-palette-outline',
  PaymentIcon:             'card-outline',
  PendingIcon:             'hourglass-outline',
  PeopleIcon:              'people-outline',
  PersonAddIcon:           'person-add-outline',
  PersonIcon:              'person-outline',
  PersonOffIcon:           'person-remove-outline',
  PersonSearchIcon:        'search-outline',
  PhoneIcon:               'call-outline',
  PictureAsPdfIcon:        'document-outline',
  PlaceIcon:               'location-outline',
  PrivacyTipIcon:          'shield-checkmark-outline',
  PsychologyIcon:          'bulb-outline',
  RefreshIcon:             'refresh-outline',
  RemoveIcon:              'remove-outline',
  ReplayIcon:              'reload-outline',
  RestartAltIcon:          'reload-outline',
  SatelliteAltIcon:        'planet-outline',
  SaveIcon:                'save-outline',
  ScaleIcon:               'scale-outline',
  SearchIcon:              'search-outline',
  SecurityIcon:            'shield-checkmark-outline',
  SendIcon:                'send-outline',
  ShieldIcon:              'shield-outline',
  SquareIcon:              'square-outline',
  StarBorderIcon:          'star-outline',
  StarIcon:                'star',
  SupportAgentIcon:        'headset-outline',
  SyncAltIcon:             'swap-horizontal-outline',
  ThumbDownIcon:           'thumbs-down-outline',
  ThumbUpIcon:             'thumbs-up-outline',
  TrafficIcon:             'navigate-circle-outline',
  TrendingDownIcon:        'trending-down-outline',
  TrendingUpIcon:          'trending-up-outline',
  TuneIcon:                'options-outline',
  UploadFileIcon:          'cloud-upload-outline',
  UploadIcon:              'cloud-upload-outline',
  ViewModuleIcon:          'grid-outline',
  Visibility:              'eye-outline',
  VisibilityIcon:          'eye-outline',
  VisibilityOff:           'eye-off-outline',
  WarningAmberIcon:        'warning-outline',
  WbSunnyIcon:             'sunny-outline',
  WorkIcon:                'briefcase-outline',
};

const SRC_ROOT = path.join(__dirname, 'frontend', 'src');
const ICON_COMPONENT = path.join(SRC_ROOT, 'components', 'IonIcon.js');

function relativeImport(fromFile) {
  const rel = path.relative(path.dirname(fromFile), path.dirname(ICON_COMPONENT));
  const base = rel.replace(/\\/g, '/') || '.';
  return `${base}/IonIcon`;
}

function migrateFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;

  // 1. Collect all icon names imported from @mui/icons-material in this file
  const usedIcons = new Map(); // localName → ionName

  // Match: import XxxIcon from '@mui/icons-material/...'
  const singleImportRe = /import\s+(\w+)\s+from\s+'@mui\/icons-material\/[^']+';?\n?/g;
  let m;
  while ((m = singleImportRe.exec(src)) !== null) {
    const localName = m[1];
    if (ICON_MAP[localName]) {
      usedIcons.set(localName, ICON_MAP[localName]);
    }
  }

  // Match: import { XxxIcon, YyyIcon } from '@mui/icons-material'
  const multiImportRe = /import\s*\{([^}]+)\}\s*from\s*'@mui\/icons-material';?\n?/g;
  while ((m = multiImportRe.exec(src)) !== null) {
    const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
    for (const name of names) {
      if (ICON_MAP[name]) usedIcons.set(name, ICON_MAP[name]);
    }
  }

  if (usedIcons.size === 0) return false; // nothing to do

  // 2. Remove all @mui/icons-material import lines
  src = src.replace(/import\s+\w+\s+from\s+'@mui\/icons-material\/[^']+';?\n?/g, '');
  src = src.replace(/import\s*\{[^}]+\}\s*from\s*'@mui\/icons-material';?\n?/g, '');

  // 3. Add IonIcon import after the last remaining import (or at top)
  const importPath = relativeImport(filePath);
  const ionImport  = `import IonIcon from '${importPath}';\n`;

  // Insert after the last import line
  const lastImportMatch = [...src.matchAll(/^import\s.+$/gm)];
  if (lastImportMatch.length > 0) {
    const last = lastImportMatch[lastImportMatch.length - 1];
    const insertAt = last.index + last[0].length;
    src = src.slice(0, insertAt) + '\n' + ionImport + src.slice(insertAt);
  } else {
    src = ionImport + src;
  }

  // 4. Replace JSX usage: <IconName → <IonIcon name="..."
  //    Also handle closing tags: </IconName> (rare but possible)
  const allIconNames = [...usedIcons.keys()];
  // Sort longest first to avoid partial replacements
  allIconNames.sort((a, b) => b.length - a.length);

  for (const iconName of allIconNames) {
    const ionName = usedIcons.get(iconName);
    // Opening: <IconName followed by whitespace, /, or >
    const openRe = new RegExp(`<${iconName}([ \\t\\n/>])`, 'g');
    src = src.replace(openRe, `<IonIcon name="${ionName}"$1`);
    // Closing: </IconName>
    const closeRe = new RegExp(`</${iconName}>`, 'g');
    src = src.replace(closeRe, `</IonIcon>`);
  }

  if (src === original) return false;
  fs.writeFileSync(filePath, src, 'utf8');
  return true;
}

// ── Run ───────────────────────────────────────────────────────────────────────
function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.name.endsWith('.js')) results.push(full);
  }
  return results;
}

const files = walk(SRC_ROOT);
let changed = 0, skipped = 0;
for (const f of files) {
  if (migrateFile(f)) { changed++; console.log('✓', path.relative(SRC_ROOT, f)); }
  else skipped++;
}
console.log(`\nDone. ${changed} files updated, ${skipped} unchanged.`);
