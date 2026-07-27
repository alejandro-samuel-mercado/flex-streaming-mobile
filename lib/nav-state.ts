import { useEffect } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

type Listener = (visible: boolean) => void;
const listeners = new Set<Listener>();
let currentVisibility = true;
let lastScrollY = 0;

export function subscribeNavVisibility(listener: Listener) {
  listeners.add(listener);
  listener(currentVisibility);
  return () => {
    listeners.delete(listener);
  };
}

export function setNavVisibility(visible: boolean) {
  if (currentVisibility !== visible) {
    currentVisibility = visible;
    listeners.forEach((l) => l(visible));
  }
}

export function handleNavScroll(event: any) {
  if (!event || !event.nativeEvent || !event.nativeEvent.contentOffset) return;
  const currentY = event.nativeEvent.contentOffset.y;
  const diff = currentY - lastScrollY;
  
  if (currentY < 30) {
    setNavVisibility(true);
  } else if (diff > 8 && currentY > 50) {
    // Scrolling down -> hide navbars
    setNavVisibility(false);
  } else if (diff < -8) {
    // Scrolling up -> show navbars
    setNavVisibility(true);
  }
  lastScrollY = Math.max(0, currentY);
}

export function useNavVisibility() {
  const visible = useSharedValue(1); // 1 = visible, 0 = hidden
  
  useEffect(() => {
    const unsubscribe = subscribeNavVisibility((isVisible) => {
      visible.value = withTiming(isVisible ? 1 : 0, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    });
    return () => unsubscribe();
  }, [visible]);

  return visible;
}
