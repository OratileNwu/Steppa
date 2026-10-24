import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Fade + rise, staggered by `delay`. Spread onto an Animated.View's style.
export default function useEntrance(delay = 0, distance = 18) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return {
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  };
}
