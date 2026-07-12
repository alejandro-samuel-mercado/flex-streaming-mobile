import { Platform, Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

export const isTV = Platform.isTV;

export const scale = (size: number, tvScale = 1.5) => {
  return (isTV ? size * tvScale : size) * 0.8;
};

export const UI_SPACING = {
  horizontal: isTV ? 60 : 20,
  vertical: isTV ? 40 : 20,
};

export const SCREEN_DIMENSIONS = {
  width: SW,
  height: SH,
};
