import React from 'react';
import { Text as RNText, type StyleProp, type TextStyle } from 'react-native';
import { font } from '../theme';

/**
 * Nerd Font-glyfer (Material Design Icons-delen av fonten). Samme tilnærming
 * som Omarchy-plugins bruker: ikoner er tekst, ikke bilder eller SVG.
 */
export const glyphs = {
  cog: '\u{f0493}', // 󰒓
  info: '\u{f02fc}', // 󰋼
  close: '\u{f0156}', // 󰅖
  check: '\u{f012c}', // 󰄬
  plus: '\u{f0415}', // 󰐕
  minus: '\u{f0374}', // 󰍴
  trash: '\u{f01b4}', // 󰆴
  play: '\u{f040a}', // 󰐊
  pause: '\u{f03e4}', // 󰏤
  stop: '\u{f04db}', // 󰓛
  restart: '\u{f0709}', // 󰜉
  refresh: '\u{f0453}', // 󰑓
  sync: '\u{f04e6}', // 󰓦
  download: '\u{f01da}', // 󰇚
  chevronDown: '\u{f0140}', // 󰅀
  chevronRight: '\u{f0142}', // 󰅂
  arrowLeft: '\u{f004d}', // 󰁍
  arrowRight: '\u{f0054}', // 󰁔
  server: '\u{f048b}', // 󰒋
  serverNetwork: '\u{f048f}', // 󰒏
  docker: '\u{f0868}', // 󰡨
  cube: '\u{f01a7}', // 󰆧
  layers: '\u{f0328}', // 󰌨
  database: '\u{f01bc}', // 󰆼
  cpu: '\u{f0ee0}', // 󰻠
  memory: '\u{f035b}', // 󰍛
  clock: '\u{f0954}', // 󰥔
  network: '\u{f06f3}', // 󰛳
  lan: '\u{f0379}', // 󰍹
  terminal: '\u{f018d}', // 󰆍
  file: '\u{f0214}', // 󰈔
  key: '\u{f030b}', // 󰌋
  lock: '\u{f033e}', // 󰌾
  lockOpen: '\u{f09ca}', // 󰧊
  translate: '\u{f05ca}', // 󰗊
  palette: '\u{f03d8}', // 󰏘
  warning: '\u{f002a}', // 󰀪
  github: '\u{f02a4}', // 󰊤
  tag: '\u{f04f9}', // 󰓹
  list: '\u{f0279}', // 󰉹
  chart: '\u{f0128}', // 󰄨
  image: '\u{f02e9}', // 󰋩
  eye: '\u{f0208}', // 󰈈
  eyeOff: '\u{f0209}', // 󰈉
  copy: '\u{f018f}', // 󰆏
  logout: '\u{f0206}', // 󰈆
  link: '\u{f0337}', // 󰌷
  information: '\u{f02fc}', // 󰋼
  'shield-check': '\u{f0565}', // 󰕥
  chip: '\u{f035b}', // 󰍛
  chevronUp: '\u{f0143}', // 󰅃
} as const;

export type IconName = keyof typeof glyphs;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  /** Tekst for skjermlesere. Ikoner skjules for tilgjengelighet som standard. */
  accessibilityLabel?: string;
}

/** Ikon som en Nerd Font-glyf. */
export function Icon({ name, size = 16, color, style, accessibilityLabel }: Props) {
  return (
    <RNText
      allowFontScaling={false}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      style={[
        {
          fontFamily: font.regular,
          fontSize: size,
          lineHeight: Math.round(size * 1.2),
          color,
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        style,
      ]}
    >
      {glyphs[name]}
    </RNText>
  );
}
