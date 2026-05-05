/**
 * Native Stepper — animated multi-step form wizard for React Native.
 * Mirrors the React Bits Stepper API adapted for RN (no Framer Motion / DOM).
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';

const W = Dimensions.get('window').width;

export type StepDef = {
  title: string;
  content: React.ReactNode;
};

type StepperProps = {
  steps: StepDef[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  /** Return false from here to block advancing (e.g. validation failed) */
  canAdvance?: (currentStep: number) => boolean;
};

export default function Stepper({
  steps,
  initialStep = 0,
  onStepChange,
  onComplete,
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  completeButtonText = 'Save Trip',
  canAdvance,
}: StepperProps) {
  const [current, setCurrent] = useState(initialStep);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const total = steps.length;
  const isLast = current === total - 1;

  const slide = (dir: number, after: () => void) => {
    Animated.timing(slideAnim, {
      toValue: dir * -W,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(dir * W);
      after();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    if (canAdvance && !canAdvance(current)) return;
    if (isLast) { onComplete?.(); return; }
    slide(1, () => {
      const next = current + 1;
      setCurrent(next);
      onStepChange?.(next);
    });
  };

  const handleBack = () => {
    if (current === 0) return;
    slide(-1, () => {
      const prev = current - 1;
      setCurrent(prev);
      onStepChange?.(prev);
    });
  };

  return (
    <View style={styles.root}>
      {/* ── Step indicator row ── */}
      <View style={styles.indicatorRow}>
        {steps.map((step, i) => {
          const status: 'inactive' | 'active' | 'complete' =
            i < current ? 'complete' : i === current ? 'active' : 'inactive';
          return (
            <React.Fragment key={i}>
              <View style={styles.indicatorItem}>
                <View
                  style={[
                    styles.circle,
                    status === 'active' && styles.circleActive,
                    status === 'complete' && styles.circleComplete,
                  ]}
                >
                  {status === 'complete' ? (
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  ) : status === 'active' ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <Text style={styles.circleNum}>{i + 1}</Text>
                  )}
                </View>
                <Text
                  style={[styles.stepLabel, status === 'active' && styles.stepLabelActive]}
                  numberOfLines={1}
                >
                  {step.title}
                </Text>
              </View>
              {i < total - 1 && (
                <View style={[styles.connector, i < current && styles.connectorDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Animated content ── */}
      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>
        {steps[current]?.content}
      </Animated.View>

      {/* ── Footer ── */}
      <View style={[styles.footer, current > 0 ? styles.footerSpread : styles.footerEnd]}>
        {current > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={15} color={ranaColors.textPrimary} />
            <Text style={styles.backBtnText}>{backButtonText}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{isLast ? completeButtonText : nextButtonText}</Text>
          <Ionicons
            name={isLast ? 'checkmark-circle-outline' : 'chevron-forward'}
            size={15}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // indicator
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: ranaSpacing.md,
    paddingVertical: 16,
  },
  indicatorItem: {
    alignItems: 'center',
    maxWidth: 64,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5EBF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C8D5EC',
  },
  circleActive: {
    backgroundColor: ranaColors.primary,
    borderColor: ranaColors.primary,
  },
  circleComplete: {
    backgroundColor: ranaColors.primary,
    borderColor: ranaColors.primary,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  circleNum: {
    fontSize: 12,
    fontWeight: '700',
    color: ranaColors.textSecondary,
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color: ranaColors.textSecondary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: ranaColors.primary,
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: 15,
    backgroundColor: '#C8D5EC',
    borderRadius: 1,
  },
  connectorDone: {
    backgroundColor: ranaColors.primary,
  },

  // content
  content: {
    flex: 1,
    overflow: 'hidden',
  },

  // footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: ranaSpacing.md,
    paddingVertical: 16,
    gap: ranaSpacing.xs,
  },
  footerEnd: { justifyContent: 'flex-end' },
  footerSpread: { justifyContent: 'space-between' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.card,
    borderWidth: 1,
    borderColor: '#C8D5EC',
    ...ranaShadow.soft,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: ranaRadius.pill,
    backgroundColor: ranaColors.primary,
    ...ranaShadow.card,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
