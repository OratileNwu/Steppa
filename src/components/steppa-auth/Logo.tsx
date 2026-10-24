import { Image } from 'react-native';

// Official Steppa logo (pin + wordmark). size 1 = welcome screen, ~0.7 = headers.
const RATIO = 376 / 143;
export default function Logo({ size = 1 }: { size?: number }) {
  const h = 54 * size;
  return <Image source={require('../../../assets/steppa-auth/logo.png')} style={{ height: h, width: h * RATIO }} resizeMode="contain" />;
}
