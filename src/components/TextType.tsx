import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleProp, Text, TextStyle, View } from 'react-native';

type TextTypeProps = {
  texts: string[];
  typingSpeed?: number; // ms per char
  deletingSpeed?: number; // ms per char when deleting
  pauseDuration?: number; // pause after full sentence
  loop?: boolean;
  showCursor?: boolean;
  cursorCharacter?: string;
  cursorBlinkDuration?: number; // seconds
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: object;
};

export default function TextType({
  texts,
  typingSpeed = 75,
  deletingSpeed = 40,
  pauseDuration = 1200,
  loop = true,
  showCursor = true,
  cursorCharacter = '|',
  cursorBlinkDuration = 0.6,
  textStyle,
  containerStyle,
}: TextTypeProps) {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!showCursor) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0, duration: cursorBlinkDuration * 500, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: cursorBlinkDuration * 500, useNativeDriver: true }),
      ])
    ).start();
  }, [blink, cursorBlinkDuration, showCursor]);

  const currentText = useMemo(() => texts[idx % texts.length] ?? '', [texts, idx]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    if (!deleting) {
      if (charIndex < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayed((s) => s + currentText.charAt(charIndex));
          setCharIndex((c) => c + 1);
        }, typingSpeed);
      } else {
        // finished typing
        timeout = setTimeout(() => {
          setDeleting(true);
        }, pauseDuration);
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed((s) => s.slice(0, -1));
        }, deletingSpeed);
      } else {
        setDeleting(false);
        setCharIndex(0);
        setIdx((i) => (i + 1) % texts.length);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [charIndex, currentText, deleting, displayed.length, deletingSpeed, pauseDuration, typingSpeed, texts.length]);

  return (
    <View style={containerStyle}>
      <Text style={textStyle} numberOfLines={1}>
        {displayed}
        {showCursor && (
          <Animated.Text style={{ opacity: blink }}>
            {cursorCharacter}
          </Animated.Text>
        )}
      </Text>
    </View>
  );
}
