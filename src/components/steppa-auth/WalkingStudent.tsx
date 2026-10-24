import React, { memo } from 'react';
import { Image, View } from 'react-native';

const M = [
  require('../../../assets/steppa-auth/walk/f00.png'), require('../../../assets/steppa-auth/walk/f01.png'), require('../../../assets/steppa-auth/walk/f02.png'), require('../../../assets/steppa-auth/walk/f03.png'),
  require('../../../assets/steppa-auth/walk/f04.png'), require('../../../assets/steppa-auth/walk/f05.png'), require('../../../assets/steppa-auth/walk/f06.png'), require('../../../assets/steppa-auth/walk/f07.png'),
  require('../../../assets/steppa-auth/walk/f08.png'), require('../../../assets/steppa-auth/walk/f09.png'), require('../../../assets/steppa-auth/walk/f10.png'), require('../../../assets/steppa-auth/walk/f11.png'),
  require('../../../assets/steppa-auth/walk/f12.png'), require('../../../assets/steppa-auth/walk/f13.png'), require('../../../assets/steppa-auth/walk/f14.png'), require('../../../assets/steppa-auth/walk/f15.png'),
  require('../../../assets/steppa-auth/walk/f16.png'), require('../../../assets/steppa-auth/walk/f17.png'), require('../../../assets/steppa-auth/walk/f18.png'), require('../../../assets/steppa-auth/walk/f19.png'),
  require('../../../assets/steppa-auth/walk/f20.png'), require('../../../assets/steppa-auth/walk/f21.png'), require('../../../assets/steppa-auth/walk/f22.png'), require('../../../assets/steppa-auth/walk/f23.png'),
];
const F = [
  require('../../../assets/steppa-auth/walkf/f00.png'), require('../../../assets/steppa-auth/walkf/f01.png'), require('../../../assets/steppa-auth/walkf/f02.png'), require('../../../assets/steppa-auth/walkf/f03.png'),
  require('../../../assets/steppa-auth/walkf/f04.png'), require('../../../assets/steppa-auth/walkf/f05.png'), require('../../../assets/steppa-auth/walkf/f06.png'), require('../../../assets/steppa-auth/walkf/f07.png'),
  require('../../../assets/steppa-auth/walkf/f08.png'), require('../../../assets/steppa-auth/walkf/f09.png'), require('../../../assets/steppa-auth/walkf/f10.png'), require('../../../assets/steppa-auth/walkf/f11.png'),
  require('../../../assets/steppa-auth/walkf/f12.png'), require('../../../assets/steppa-auth/walkf/f13.png'), require('../../../assets/steppa-auth/walkf/f14.png'), require('../../../assets/steppa-auth/walkf/f15.png'),
  require('../../../assets/steppa-auth/walkf/f16.png'), require('../../../assets/steppa-auth/walkf/f17.png'), require('../../../assets/steppa-auth/walkf/f18.png'), require('../../../assets/steppa-auth/walkf/f19.png'),
  require('../../../assets/steppa-auth/walkf/f20.png'), require('../../../assets/steppa-auth/walkf/f21.png'), require('../../../assets/steppa-auth/walkf/f22.png'), require('../../../assets/steppa-auth/walkf/f23.png'),
];

type FrameProps = { src: number; on: boolean; w: number; h: number };
const Frame = memo(({ src, on, w, h }: FrameProps) => (
  <Image source={src} style={{ position: 'absolute', width: w, height: h, opacity: on ? 1 : 0 }} />
));

// Controlled by Scene: `who` 0 = male, 1 = female; `frame` = 0..23
export default function WalkingStudent({ height = 150, who = 0, frame = 6 }: { height?: number; who?: number; frame?: number }) {
  const w = (height * 174) / 360;
  const set = who ? F : M;
  return (
    <View style={{ width: w, height }}>
      {set.map((src, k) => <Frame key={`${who}-${k}`} src={src} on={k === frame} w={w} h={height} />)}
    </View>
  );
}
