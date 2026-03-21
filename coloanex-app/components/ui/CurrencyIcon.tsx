import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface CurrencyIconProps {
  size?: number;
  color?: string;
  style?: any;
}

export const CurrencyIcon: React.FC<CurrencyIconProps> = ({
  size = 16,
  color = "#000",
  style,
}) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <Path d="M15 5h-11h3a4 4 0 1 1 0 8h-3l6 6" />
        <Path d="M21 17l-4.586 -4.414a2 2 0 0 0 -2.828 2.828l.707 .707" />
      </Svg>
    </View>
  );
};
