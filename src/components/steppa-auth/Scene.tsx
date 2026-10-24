import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import WalkingStudent from './WalkingStudent';
import { timeline } from './timeline';
import { brand as colors, fonts } from './tokens';

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Endless strip: two copies side by side; the parent feeds the translateX.
const Layer = ({ x, L, children }: { x: Animated.Value; L: number; children?: React.ReactNode }) => (
  <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: L * 2, flexDirection: 'row', transform: [{ translateX: x }] }}>
    <View style={{ width: L }}>{children}</View>
    <View style={{ width: L }}>{children}</View>
  </Animated.View>
);

const Tree = ({ left, bottom }: { left: number; bottom: number }) => (
  <View style={{ position: 'absolute', left, bottom, width: 46, height: 92 }}>
    <View style={{ position: 'absolute', left: 17, top: 42, width: 12, height: 50, backgroundColor: colors.sage, borderRadius: 3 }} />
    <View style={{ position: 'absolute', left: 0, top: 0, width: 46, height: 46, borderRadius: 9, backgroundColor: colors.green, transform: [{ rotate: '45deg' }] }} />
  </View>
);

const Cloud = ({ left, top, s = 1 }: { left: number; top: number; s?: number }) => (
  <View style={{ position: 'absolute', left, top, opacity: 0.85 }}>
    <View style={{ width: 54 * s, height: 16 * s, borderRadius: 10 * s, backgroundColor: colors.white }} />
    <View style={{ position: 'absolute', left: 10 * s, top: -8 * s, width: 24 * s, height: 24 * s, borderRadius: 12 * s, backgroundColor: colors.white }} />
  </View>
);

// 100 x 90 (× s) little house. The window lights up when the parcel arrives.
const House = ({ s, roof, door, glow }: { s: number; roof: string; door: string; glow: Animated.Value }) => (
  <View style={{ width: 100 * s, height: 90 * s }}>
    <View style={{ position: 'absolute', left: 12 * s, top: 36 * s, width: 76 * s, height: 54 * s, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.sage, borderBottomLeftRadius: 5 * s, borderBottomRightRadius: 5 * s }} />
    <View style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, borderLeftWidth: 50 * s, borderRightWidth: 50 * s, borderBottomWidth: 38 * s, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: roof }} />
    <View style={{ position: 'absolute', left: 41 * s, top: 60 * s, width: 18 * s, height: 30 * s, backgroundColor: door, borderTopLeftRadius: 9 * s, borderTopRightRadius: 9 * s }} />
    {[20, 64].map((l) => (
      <View key={l} style={{ position: 'absolute', left: l * s, top: 50 * s, width: 16 * s, height: 14 * s, borderRadius: 3 * s, backgroundColor: colors.mintDeep }}>
        <Animated.View style={{ ...StyleSheet.absoluteFill, borderRadius: 3 * s, backgroundColor: colors.sun, opacity: glow }} />
      </View>
    ))}
  </View>
);

// Brown paper bag with "steppa" on it
const Bag = ({ s }: { s: number }) => {
  const w = 28 * s, h = 34 * s;
  return (
    <View style={{ width: w, height: h }}>
      <View style={{ position: 'absolute', left: w * 0.28, top: -h * 0.2, width: w * 0.44, height: h * 0.26, borderWidth: 1.5, borderBottomWidth: 0, borderColor: '#8F6038', borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
      <View style={{ flex: 1, backgroundColor: '#B98355', borderRadius: 3 * s, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h * 0.16, backgroundColor: '#A06E42' }} />
        <Text style={{ marginTop: h * 0.12, fontFamily: fonts.bold, fontSize: 7.2 * s, color: '#FFF3DC', letterSpacing: -0.2 }}>steppa</Text>
      </View>
    </View>
  );
};

export default function Scene({ height = 230, style, studentScale = 0.66 }: { height?: number; style?: StyleProp<ViewStyle>; studentScale?: number }) {
  const [w, setW] = useState(0);
  const [who, setWho] = useState(0);
  const [frame, setFrame] = useState(6);
  const cur = useRef({ who: 0, frame: 6 });
  const sun = useRef(new Animated.Value(0)).current;
  const v = useRef<Record<string, Animated.Value>>(Object.fromEntries(
    ['cl', 'hl', 'tr', 'gr', 'house', 'fg', 'charOp', 'charX', 'charY', 'bagX', 'bagY', 'bagOp', 'pillS', 'pillOp', 'glow'].map((k) => [k, new Animated.Value(0)])
  )).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(sun, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(sun, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  // geometry (everything scales with the card height)
  const g = height * 0.3, s = height / 240, bs = Math.max(s, 0.8);
  const ph = height * studentScale, pw = (ph * 174) / 360;
  const xC = w * 0.34;
  const gap = 72, L = Math.ceil(Math.max(w, 300) / gap) * gap, Lc = L + 80;
  const doorCx = xC + pw / 2 + 34 * s;
  const houseLeft = doorCx - 50 * s;
  const bw = 28 * bs, bh = 34 * bs;
  const handX = xC - pw / 2 + pw * 0.62 - bw / 2, handY = height - g * 0.45 - ph + ph * 0.52 - bh / 2;
  const stepX = doorCx - bw / 2, stepY = height - g + 6 + 12 * s - bh;

  useEffect(() => {
    if (!w) return;
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const S = timeline(Date.now() - t0);
      v.cl.setValue(-((S.D * 0.1) % Lc)); v.hl.setValue(-((S.D * 0.22) % L));
      v.tr.setValue(-((S.D * 0.5) % L)); v.gr.setValue(-(S.D % L));
      v.house.setValue(houseLeft + S.houseDX); v.fg.setValue(S.fg);
      v.charOp.setValue(S.charOp); v.charX.setValue(S.charDX); v.charY.setValue(S.bobY);
      const k = S.deliver;
      v.bagX.setValue(lerp(handX + S.charDX, stepX, k));
      v.bagY.setValue(lerp(handY + S.bobY, stepY, k) - Math.sin(Math.PI * k) * 18 * s);
      v.bagOp.setValue(k > 0 ? S.fg : S.charOp);
      const p = S.pill;
      v.pillS.setValue(p < 0.7 ? (p / 0.7) * 1.15 : 1.15 - ((p - 0.7) / 0.3) * 0.15);
      v.pillOp.setValue(p > 0 ? S.fg : 0);
      v.glow.setValue(S.glow);
      if (S.frame !== cur.current.frame) { cur.current.frame = S.frame; setFrame(S.frame); }
      if (S.who !== cur.current.who) { cur.current.who = S.who; setWho(S.who); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [w, height]);

  const dashes = Array.from({ length: L / gap });
  const roof = who ? colors.sun : colors.green;
  const door = who ? colors.green : '#8A5A44';

  return (
    <View style={[styles.card, { height }, style]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <>
          <Animated.View style={{ position: 'absolute', top: 18, right: 30, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sun,
            transform: [{ translateY: sun.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }, { scale: sun.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] }} />
          <Layer x={v.cl} L={Lc}><Cloud left={30} top={26} s={1} /><Cloud left={Lc * 0.58} top={52} s={0.8} /></Layer>
          <Layer x={v.hl} L={L}>
            <View style={{ position: 'absolute', left: -30, bottom: g - 70, width: 190, height: 190, borderRadius: 95, backgroundColor: colors.mintDeep }} />
            <View style={{ position: 'absolute', left: L * 0.55, bottom: g - 84, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.mintDeep }} />
          </Layer>
          <Layer x={v.tr} L={L}><Tree left={L * 0.12} bottom={g - 6} /><Tree left={L * 0.68} bottom={g - 6} /></Layer>

          <Animated.View style={{ position: 'absolute', left: 0, bottom: g - 6, opacity: v.fg, transform: [{ translateX: v.house }] }}>
            <House s={s} roof={roof} door={door} glow={v.glow} />
          </Animated.View>

          <View style={[styles.ground, { height: g }]}>
            <Layer x={v.gr} L={L}>
              {dashes.map((_, k) => <View key={k} style={{ position: 'absolute', left: k * gap + 10, bottom: g * 0.2, width: 28, height: 4, borderRadius: 2, backgroundColor: colors.sageDeep }} />)}
            </Layer>
          </View>

          <Animated.View style={{ position: 'absolute', left: xC - pw / 2, bottom: g * 0.45, opacity: v.charOp, transform: [{ translateX: v.charX }, { translateY: v.charY }] }}>
            <View style={{ position: 'absolute', bottom: -4, left: pw / 2 - 32, width: 64, height: 9, borderRadius: 5, backgroundColor: 'rgba(15,79,49,0.14)' }} />
            <WalkingStudent height={ph} who={who} frame={frame} />
          </Animated.View>

          <Animated.View style={{ position: 'absolute', left: 0, top: 0, opacity: v.bagOp, transform: [{ translateX: v.bagX }, { translateY: v.bagY }] }}>
            <Bag s={bs} />
          </Animated.View>

          <Animated.View style={[styles.pill, { left: houseLeft + 50 * s - 40, top: height - g + 6 - 90 * s - 26, opacity: v.pillOp, transform: [{ scale: v.pillS }] }]}>
            <Text style={styles.pillText}>Delivered ✓</Text>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.mint, borderRadius: 24, overflow: 'hidden' },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.sage, overflow: 'hidden' },
  pill: { position: 'absolute', width: 80, height: 22, borderRadius: 11, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: colors.green, shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  pillText: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.green },
});
