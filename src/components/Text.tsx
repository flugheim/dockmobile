import React, { type FC } from 'react';
import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { font } from '../theme';

/**
 * `Text` med appens font. `fontWeight` oversettes til den fete fontfilen, slik
 * at vanlige stiler (`fontWeight: '700'`) fortsatt fungerer med en egen font.
 * Bruk denne i stedet for `Text` fra react-native.
 */
export const Text: FC<TextProps> = ({ style, ...rest }) => {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const weight = flat.fontWeight;
  const bold = weight === 'bold' || Number(weight ?? 0) >= 600;
  const merged: TextStyle = { ...flat, fontFamily: bold ? font.bold : font.regular };
  if (bold) delete merged.fontWeight;
  return <RNText {...rest} style={merged} />;
};
